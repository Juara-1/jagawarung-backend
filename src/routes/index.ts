import { Router } from 'express';
import exampleRoutes from './example.routes';
import debtRoutes from './debt.routes';
import agentRoutes from './agent.routes';

const router = Router();

// Mount routes here
router.use('/examples', exampleRoutes);
router.use('/debts', debtRoutes);
router.use('/agent', agentRoutes);

// Add more routes as needed:
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);
// router.use('/orders', orderRoutes);

export default router;
