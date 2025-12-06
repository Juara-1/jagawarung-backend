import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { validate } from '../middleware/validate';
import {
  transactionCreateSchema,
  transactionIdParamSchema,
  transactionListQuerySchema,
  transactionSummaryQuerySchema,
} from '../validators/transaction.schema';

const router = Router();

// Get paginated transactions - validate query params
router.get('/', validate(transactionListQuerySchema, 'query'), transactionController.getTransactions);

// Get transaction summary - validate query params
router.get('/summary', validate(transactionSummaryQuerySchema, 'query'), transactionController.getTransactionSummary);

// Create transaction
router.post('/', validate(transactionCreateSchema), transactionController.createTransaction);

// Update transaction
router.put('/:id',  validate(transactionIdParamSchema, 'params'), transactionController.updateTransactionById);

// Delete transaction by id
router.delete('/:id', validate(transactionIdParamSchema, 'params'), transactionController.deleteTransactionById);

export default router;