import { Request, Response, NextFunction } from 'express';
import { sendPrompt } from '../services/ai.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

interface AgentPromptRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

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
    const { prompt, model, temperature, maxTokens, systemPrompt } =
      req.body as AgentPromptRequest;

    if (!prompt || typeof prompt !== 'string') {
      throw new AppError('prompt is required and must be a string', 400);
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
