import { Router } from 'express';
import { validate } from '../middleware/validate';
import { agentDebtsRequestSchema } from '../validators/agent.schema';
import { parseDebtPrompt } from '../controllers/agent.controller';

const router = Router();

/**
 * POST /api/agent
 * @summary Test endpoint
 * @tags Agent
 */
router.post('/', (_req, res) => {
  res.send('Test');
});

/**
 * POST /api/agent/debts
 * @summary Parse a natural language prompt about debts using AI
 * @tags Agent
 * @param {object} request.body.required - Request body
 * @param {string} request.body.prompt.required - The user's natural language prompt
 * @return {object} 200 - Parsed debt intent
 * @return {object} 400 - Validation error
 */
router.post('/debts', validate(agentDebtsRequestSchema, 'body'), parseDebtPrompt);

export default router;
