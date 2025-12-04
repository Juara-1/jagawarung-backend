import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as exampleController from '../controllers/example.controller';

const router = Router();

// Public route
router.get('/', exampleController.getAll);
router.get('/:id', exampleController.getById);

// Protected routes (require authentication)
router.post('/', authenticate, exampleController.create);
router.put('/:id', authenticate, exampleController.update);
router.delete('/:id', authenticate, exampleController.remove);

export default router;
