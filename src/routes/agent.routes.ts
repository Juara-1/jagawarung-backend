import { Router } from 'express';
import { promptAgent } from '../controllers/agent.controller';

const router = Router();

router.post('/', promptAgent);

export default router;
