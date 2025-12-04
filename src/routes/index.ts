import { Router } from 'express';
import exampleRoutes from './example.routes';

const router = Router();

// Mount routes here
router.use('/examples', exampleRoutes);

// Add more routes as needed:
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);
// router.use('/orders', orderRoutes);

export default router;
