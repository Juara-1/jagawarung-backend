import { randomUUID } from 'crypto';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

const { serverUrl, apiKey } = config.mcp;

const MCP_PROTOCOL_VERSION = '2024-11-05';
const CLIENT_INFO = {
  name: 'jagawarung-backend',
  version: '1.0.0',
};
const CLIENT_CAPABILITIES = {};

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string;
  result?: T;
  error?: JsonRpcError;
}

interface RpcCallResult<T> {
  result: T;
  sessionId?: string | null;
}

interface InvokeToolPayload {
  toolName: string;
  arguments?: Record<string, unknown>;
}

interface ToolDescriptor {
  name: string;
  description?: string;
  inputSchema?: unknown;
  [key: string]: unknown;
}

interface InitializeResult {
  session?: { id: string };
  sessionId?: string;
  [key: string]: any;
}

const ensureFetchAvailable = (): typeof fetch => {
  if (typeof fetch !== 'function') {
    throw new AppError('Fetch API is not available in this environment', 500);
  }

  return fetch;
};

const buildHeaders = (sessionId?: string) => {
  if (!apiKey) {
    throw new AppError('MCP API key is not configured', 500);
  }

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${apiKey}`,
    'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
    ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
  };
};

let activeSessionId: string | null = null;
let sessionInitPromise: Promise<string> | null = null;

const sendJsonRpcRequest = async <T = unknown>(
  method: string,
  params?: Record<string, unknown>,
  sessionId?: string
): Promise<RpcCallResult<T>> => {
  if (!serverUrl) {
    throw new AppError('MCP server URL is not configured', 500);
  }

  const fetchFn = ensureFetchAvailable();
  const requestId = randomUUID();
  const requestBody = {
    jsonrpc: '2.0' as const,
    id: requestId,
    method,
    params,
  };

  const requestInit: RequestInit = {
    method: 'POST',
    headers: buildHeaders(sessionId),
    body: JSON.stringify(requestBody),
  };

  const response = await fetchFn(serverUrl, requestInit);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');

    throw new AppError(
      `MCP request failed with status ${response.status}: ${errorText || response.statusText}`,
      response.status
    );
  }

  const data = (await response.json().catch(() => null)) as JsonRpcResponse<T> | null;

  if (!data) {
    throw new AppError('MCP response was empty or invalid JSON', 502);
  }

  if (data.error) {
    throw new AppError(
      `MCP error (${data.error.code}): ${data.error.message}`,
      502
    );
  }

  if (typeof data.result === 'undefined') {
    throw new AppError('MCP response missing result payload', 502);
  }

  const responseSessionId =
    response.headers.get('Mcp-Session-Id') ||
    response.headers.get('MCP-Session-Id');

  return {
    result: data.result,
    sessionId: responseSessionId,
  };
};

const initializeSession = async (): Promise<string> => {
  const { result, sessionId: headerSessionId } =
    await sendJsonRpcRequest<InitializeResult>('initialize', {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: CLIENT_CAPABILITIES,
    clientInfo: CLIENT_INFO,
  });

  const newSessionId =
    headerSessionId || result?.session?.id || result?.sessionId || (result as any)?.id;

  if (!newSessionId) {
    throw new AppError('MCP initialize response missing session id', 502);
  }

  activeSessionId = newSessionId;
  return newSessionId;
};

const ensureSession = async (): Promise<string> => {
  if (activeSessionId) {
    return activeSessionId;
  }

  if (!sessionInitPromise) {
    sessionInitPromise = initializeSession().finally(() => {
      sessionInitPromise = null;
    });
  }

  return sessionInitPromise;
};

export const callMcp = async <T = unknown>(
  method: string,
  params?: Record<string, unknown>
): Promise<T> => {
  if (method === 'initialize') {
    const { result } = await sendJsonRpcRequest<T>(method, params);
    return result;
  }

  const sessionId = await ensureSession();
  const { result } = await sendJsonRpcRequest<T>(method, params, sessionId);
  return result;
};

export const invokeMcpTool = async <T = unknown>(payload: InvokeToolPayload): Promise<T> => {
  return callMcp<T>('tools/call', {
    name: payload.toolName,
    arguments: payload.arguments,
  });
};

export const listMcpTools = async (): Promise<ToolDescriptor[]> => {
  const response = await callMcp<{ tools: ToolDescriptor[] }>('tools/list');
  return response.tools || [];
};

export const getTableDefinitions = async (): Promise<string> => {
  const response = await invokeMcpTool<{ content?: Array<{ text?: string }> }>(
    {
      toolName: 'list_tables',
    }
  );

  const textContent = response?.content?.map((entry) => entry?.text || '').join('\n') || '';
  return textContent.trim() || 'No schema information available.';
};
