import { Router } from 'express';
import { validate } from '../middleware/validate';
import { agentDebtsRequestSchema } from '../validators/agent.schema';
import { processDebtPrompt } from '../controllers/agent.controller';

const router = Router();

/**
 * POST /api/agent/transactions
 * @summary Process a natural language prompt about debts using AI and execute the appropriate action, if possible
 * @tags Agent
 * @param {object} request.body.required - Request body
 * @param {string} request.body.prompt.required - The user's natural language prompt
 * @return {object} 200 - Processed debt prompt
 * @return {object} 400 - Validation error
 */
router.post('/transactions', validate(agentDebtsRequestSchema, 'body'), processDebtPrompt);

export default router;
