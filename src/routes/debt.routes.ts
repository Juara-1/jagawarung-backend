import { Router } from 'express';
import * as debtController from '../controllers/debt.controller';

const router = Router();

// Upsert debt (create or update based on debtor_name)
router.post('/upsert', debtController.upsertDebt);

export default router;
