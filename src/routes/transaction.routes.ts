import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { validate } from '../middleware/validate';
import { transactionCreateSchema } from '../validators/transaction.schema';

const router = Router();

// Get paginated transactions
router.get('/', transactionController.getTransactions);

// Get transaction summary
router.get('/summary', transactionController.getTransactionSummary);

// Create transaction
router.post('/', validate(transactionCreateSchema), transactionController.createTransaction);

// Update transaction
router.put('/:id', transactionController.updateTransactionById);

// Delete transaction by id
router.delete('/:id', transactionController.deleteTransactionById);

export default router;