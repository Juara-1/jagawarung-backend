import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { agentRequestSchema } from '../validators/agent.schema';
import { processDebtPrompt } from '../controllers/agent.controller';

const router = Router();

router.post('/transactions', authenticate, validate(agentRequestSchema, 'body'), processDebtPrompt);

export default router;
