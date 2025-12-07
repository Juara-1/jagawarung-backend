import { Router } from 'express';
import agentRoutes from './agent.routes';
import authRoutes from './auth.routes';
import transactionRoutes from './transaction.routes';

const router = Router();

// Mount routes here
router.use('/agent', agentRoutes);
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);

// Add more routes as needed:
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);
// router.use('/orders', orderRoutes);

export default router;
