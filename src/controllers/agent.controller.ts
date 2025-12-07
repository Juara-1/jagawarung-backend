import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AgentDebtsRequest } from '../models/agent.model';
import { AgentService } from '../services/agent.service';

// Initialize agent service with default dependencies
const agentService = AgentService.withDefaults();

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

