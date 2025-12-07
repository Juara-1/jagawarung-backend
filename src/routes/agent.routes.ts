import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { agentRequestSchema } from '../validators/agent.schema';
import { processDebtPrompt } from '../controllers/agent.controller';

const router = Router();

/**
 * POST /api/agent/transactions
 * @summary Process a natural language prompt about debts using AI and execute the appropriate action, if possible
 * @tags Agent
 * @security BearerAuth
 * @param {object} request.body.required - Request body
 * @param {string} request.body.prompt.required - The user's natural language prompt
 * @return {object} 200 - Processed debt prompt
 * @return {object} 400 - Validation error
 * @return {object} 401 - Unauthorized - No token or invalid token
 */
router.post('/transactions', authenticate, validate(agentRequestSchema, 'body'), processDebtPrompt);

export default router;
