import { Router } from 'express';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/auth.schema';
import { login } from '../controllers/auth.controller';

const router = Router();

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Login request body
 * @typedef {object} LoginRequest
 * @property {string} email.required - User email address
 * @property {string} password.required - User password
 */

/**
 * Login response data
 * @typedef {object} LoginResponseData
 * @property {string} access_token - JWT access token for API authentication
 * @property {string} refresh_token - Token to refresh the access token
 * @property {number} expires_in - Token expiration time in seconds
 * @property {number} expires_at - Token expiration timestamp (Unix epoch)
 * @property {string} token_type - Token type (always "bearer")
 */

/**
 * Login response wrapper
 * @typedef {object} LoginResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} message - Response message
 * @property {LoginResponseData} data - Login response data
 */

/**
 * Error response
 * @typedef {object} ErrorResponse
 * @property {boolean} success - Always false for error responses - false
 * @property {string} message - Error message describing what went wrong
 */

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/auth/login
 * @summary Login with email and password to get JWT token
 * @tags Auth
 * @param {LoginRequest} request.body.required - Login credentials
 * @return {LoginResponse} 200 - Login successful
 * @return {ErrorResponse} 400 - Validation error
 * @return {ErrorResponse} 401 - Invalid credentials
 */
router.post('/login', validate(loginSchema, 'body'), login);

export default router;

