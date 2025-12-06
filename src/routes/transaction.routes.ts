import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { validate } from '../middleware/validate';
import {
  transactionCreateSchema,
  transactionCreateQuerySchema,
  transactionUpdateSchema,
  transactionIdParamSchema,
  transactionListQuerySchema,
  transactionSummaryQuerySchema,
  transactionRepaySchema,
} from '../validators/transaction.schema';

const router = Router();

// Get paginated transactions - validate query params
router.get('/', validate(transactionListQuerySchema, 'query'), transactionController.getTransactions);

// Get transaction summary - validate query params
router.get('/summary', validate(transactionSummaryQuerySchema, 'query'), transactionController.getTransactionSummary);

// Create transaction
router.post('/', validate(transactionCreateQuerySchema, 'query'), validate(transactionCreateSchema), transactionController.createTransaction);

// Update transaction
router.put('/:id', validate(transactionIdParamSchema, 'params'), validate(transactionUpdateSchema), transactionController.updateTransactionById);

// Delete transaction by id
router.delete('/:id', validate(transactionIdParamSchema, 'params'), transactionController.deleteTransactionById);

// Repay debt
router.post('/:id/repay', validate(transactionIdParamSchema, 'params'), validate(transactionRepaySchema), transactionController.repayDebt);

export default router;