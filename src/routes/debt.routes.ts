import { Router } from 'express';
import * as debtController from '../controllers/debt.controller';

const router = Router();

// Get debt by debtor name
router.get('/', debtController.getDebtByName);

// Upsert debt (create or update based on debtor_name)
router.post('/upsert', debtController.upsertDebt);

// Delete debt by debtor name
router.delete('/', debtController.deleteDebtByName);

export default router;
