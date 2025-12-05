import { Request, Response, NextFunction } from 'express';
import { sendPrompt } from '../services/ai.service';
import {
  invokeMcpTool,
  listMcpTools,
  getTableDefinitions,
} from '../services/mcp.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

interface AgentPromptRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  useMcp?: boolean;
  toolName?: string;
  arguments?: Record<string, unknown>;
  autoSql?: boolean;
}

const DEFAULT_MCP_TOOL = 'execute_sql';
const AUTO_SQL_INSTRUCTIONS = `You are helping to craft SQL for Supabase for either of these cases: 
  1) getting an entry (mengecek data hutang)
  2) upserting an entry (meng-input data hutang)
  3) deleting an entry (menghapus data hutang)

To determine which case to use, follow these rules:
1) If the user's prompt contains only a name, use case 1.
2) If the user's prompt contains a name and a nominal or number, use case 2.
3) If the user's prompt contains a name and the word "hapus", "lunas", use case 3.

1) When user only provides only a name, craft a query to get the total_nominal from the debts table.
The example query is:
"SELECT total_nominal FROM debts WHERE debtor_name ILIKE 'rudi';"

2) When user provides a name and a number or nominal, craft a query to upsert the entry to the debts table.
The example query is:
"INSERT INTO debts (debtor_name, total_nominal) VALUES ('rudi', 1000000) ON CONFLICT (debtor_name) DO UPDATE SET total_nominal = debts.total_nominal + EXCLUDED.total_nominal;"`;

const formatToolOutput = (output: unknown): string => {
  if (typeof output === 'string') {
    return output;
  }

  if (output === null || typeof output === 'undefined') {
    return 'No output returned from tool.';
  }

  try {
    return JSON.stringify(output, null, 2);
  } catch (error) {
    return String(output);
  }
};

const getDerivedToolName = (toolName?: string) => toolName || DEFAULT_MCP_TOOL;

const ensureToolAvailable = async (toolName: string) => {
  const tools = await listMcpTools();

  if (!tools.some(({ name }) => name === toolName)) {
    throw new AppError(`Supabase MCP ${toolName} tool is unavailable`, 503);
  }
};

const buildAutoSqlSystemPrompt = (
  systemPrompt: string | undefined,
  schemaSummary: string
) =>
  [
    systemPrompt?.trim(),
    `${AUTO_SQL_INSTRUCTIONS}

Use the following schema information:
${schemaSummary}
Respond with SQL only.`.trim(),
  ]
    .filter((segment): segment is string => Boolean(segment))
    .join('\n\n');

const generateSqlForAutoMode = async (
  basePrompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
) => {
  const schemaSummary = await getTableDefinitions();
  const autoSqlSystemPrompt = buildAutoSqlSystemPrompt(
    options.systemPrompt,
    schemaSummary
  );

  const sqlSuggestion = await sendPrompt(basePrompt, {
    model: options.model,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    systemPrompt: autoSqlSystemPrompt,
  });

  const sqlText = sqlSuggestion?.content?.trim();

  if (!sqlText) {
    throw new AppError('AI provider returned empty SQL response', 502);
  }

  return sqlText;
};

const executeAutoSqlTool = async (
  params: AgentPromptRequest & { derivedToolName: string }
) => {
  await ensureToolAvailable(params.derivedToolName);
  const sqlText = await generateSqlForAutoMode(params.prompt, params);

  return invokeMcpTool<object>({
    toolName: params.derivedToolName,
    arguments: {
      query: sqlText,
    },
  });
};

const executeManualMcpTool = async (
  derivedToolName: string,
  toolArgs?: Record<string, unknown>
) =>
  invokeMcpTool<object>({
    toolName: derivedToolName,
    arguments: toolArgs,
  });

const buildFollowUpPrompt = (
  userPrompt: string,
  toolName: string,
  toolOutput: string
) =>
  `Original user prompt:\n${userPrompt}\n\nMCP tool "${toolName}" output:\n${toolOutput}\n\nUsing the tool output above, craft a clear, client-facing response. Please only respond with one sentence response, no additional commentary.`;

const buildResponseSystemPrompt = (basePrompt?: string) =>
  [
    basePrompt?.trim(),
    'You are a helpful assistant that turns MCP tool outputs (typically Supabase SQL results) into concise, user-friendly response. Please only respond with one sentence response, no additional commentary.',
  ]
    .filter((segment): segment is string => Boolean(segment))
    .join('\n\n') || undefined;

const craftClientFacingResponse = async (
  params: AgentPromptRequest & {
    toolName: string;
    toolOutput: unknown;
  }
) => {
  const serializedToolOutput = formatToolOutput(params.toolOutput);
  const followUpPrompt = buildFollowUpPrompt(
    params.prompt,
    params.toolName,
    serializedToolOutput
  );

  const combinedSystemPrompt = buildResponseSystemPrompt(params.systemPrompt);

  return sendPrompt(followUpPrompt, {
    model: params.model,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    systemPrompt: combinedSystemPrompt,
  });
};

/**
 * AI agent response
 * @typedef {object} AgentResponse
 * @property {string} role - Role of the assistant
 * @property {string} content - Generated content
 */

/**
 * POST /api/agent
 * @summary Send a prompt to the AI agent
 * @tags Agent
 * @param {AgentPromptRequest} request.body.required - Prompt payload
 * @return {AgentResponse} 200 - AI response
 * @return {object} 400 - Validation error
 * @return {object} 500 - AI provider error
 */
export const promptAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      prompt,
      model,
      temperature,
      maxTokens,
      systemPrompt,
      useMcp,
      toolName,
      arguments: toolArgs,
      autoSql,
    } = req.body as AgentPromptRequest;

    if (!prompt || typeof prompt !== 'string') {
      throw new AppError('prompt is required and must be a string', 400);
    }

    if (useMcp) {
      const derivedToolName = getDerivedToolName(toolName);

      const mcpResponse = autoSql
        ? await executeAutoSqlTool({
            prompt,
            model,
            temperature,
            maxTokens,
            systemPrompt,
            derivedToolName,
            autoSql,
          })
        : await executeManualMcpTool(derivedToolName, toolArgs);

      const agentReply = await craftClientFacingResponse({
        prompt,
        model,
        temperature,
        maxTokens,
        systemPrompt,
        toolName: derivedToolName,
        toolOutput: mcpResponse,
      });

      sendSuccess(res, agentReply, 'Agent response generated successfully');
      return;
    }

    const aiMessage = await sendPrompt(prompt, {
      model,
      temperature,
      maxTokens,
      systemPrompt,
    });

    sendSuccess(res, aiMessage, 'Agent response generated successfully');
  } catch (error) {
    next(error);
  }
};
