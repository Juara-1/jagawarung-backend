import { Router } from 'express';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/auth.schema';
import { login } from '../controllers/auth.controller';

const router = Router();

/**
 * POST /api/auth/login
 * @summary Login with email and password to get JWT token
 * @tags Auth
 * @param {object} request.body.required - Login credentials
 * @param {string} request.body.email.required - User email address
 * @param {string} request.body.password.required - User password
 * @return {object} 200 - Login successful with access token
 * @return {object} 401 - Invalid credentials
 * @return {object} 400 - Validation error
 */
router.post('/login', validate(loginSchema, 'body'), login);

export default router;

