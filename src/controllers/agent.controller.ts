import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AgentDebtsRequest } from '../models/agent.model';
import { AgentService } from '../services/agent.service';

// Initialize agent service with default dependencies
const agentService = AgentService.withDefaults();

/**
 * POST /api/agent/debts
 * @summary Process a natural language prompt about debts using AI and execute the appropriate action, if possible
 * @tags Agent
 * @param {AgentDebtsRequest} request.body.required - User prompt to process
 * @return {ProcessDebtPromptResponse} 200 - Successfully processed debt prompt
 * @return {object} 400 - Validation error
 * @return {object} 404 - Debt not found
 * @return {object} 500 - AI service error
 */
export const processDebtPrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { prompt } = req.body as AgentDebtsRequest;

    const result = await agentService.processDebtPrompt(prompt);

    sendSuccess(res, result, result.action_result.message);
  } catch (error) {
    next(error);
  }
};

