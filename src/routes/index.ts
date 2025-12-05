import { Router } from 'express';
import exampleRoutes from './example.routes';
import agentRoutes from './agent.routes';
import transactionRoutes from './transaction.routes';

const router = Router();

// Mount routes here
router.use('/examples', exampleRoutes);
router.use('/agent', agentRoutes);
router.use('/transactions', transactionRoutes);

// Add more routes as needed:
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);
// router.use('/orders', orderRoutes);

export default router;
