import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { LoginRequest } from '../validators/auth.schema';

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

/**
 * POST /api/auth/login
 * @summary Login with email and password to get JWT token
 * @tags Auth
 * @param {LoginRequest} request.body.required - Login credentials
 * @return {LoginResponse} 200 - Login successful
 * @return {ErrorResponse} 400 - Validation error
 * @return {ErrorResponse} 401 - Invalid credentials
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body as LoginRequest;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError(error.message, 401);
    }

    if (!data.session) {
      throw new AppError('Failed to create session', 500);
    }

    sendSuccess(
      res,
      {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
        expires_at: data.session.expires_at,
        token_type: 'bearer',
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

