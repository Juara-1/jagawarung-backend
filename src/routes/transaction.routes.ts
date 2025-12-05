import { Router } from 'express';
import * as transactionController from '../controllers/transaction.controller';

const router = Router();

// Get paginated transactions
router.get('/', transactionController.getTransactions);

// Create transaction
router.post('/', transactionController.createTransaction);

// Update transaction
router.put('/:id', transactionController.updateTransactionById);

// Delete transaction by id
router.delete('/:id', transactionController.deleteTransactionById);

export default router;