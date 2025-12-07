import { Router } from 'express';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/auth.schema';
import { login } from '../controllers/auth.controller';

const router = Router();

router.post('/login', validate(loginSchema, 'body'), login);

export default router;

