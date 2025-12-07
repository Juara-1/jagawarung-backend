import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { LoginRequest } from '../validators/auth.schema';

/**
 * Login response type
 * @typedef {object} LoginResponse
 * @property {string} access_token - JWT access token for API authentication
 * @property {string} refresh_token - Token to refresh the access token
 * @property {number} expires_in - Token expiration time in seconds
 * @property {number} expires_at - Token expiration timestamp (Unix epoch)
 * @property {string} token_type - Token type (always "bearer")
 */

/**
 * POST /api/auth/login
 * @summary Login with email and password to get JWT token
 * @tags Auth
 * @param {object} request.body.required - Login credentials
 * @param {string} request.body.email.required - User email address
 * @param {string} request.body.password.required - User password
 * @return {LoginResponse} 200 - Login successful
 * @return {object} 401 - Invalid credentials
 * @return {object} 400 - Validation error
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

