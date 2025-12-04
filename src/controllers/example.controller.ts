import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

/**
 * Example object
 * @typedef {object} Example
 * @property {string} id - Example ID
 * @property {string} name - Example name
 * @property {string} description - Example description
 * @property {string} user_id - User ID
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * Create example request
 * @typedef {object} CreateExampleRequest
 * @property {string} name.required - Example name
 * @property {string} description - Example description
 */

/**
 * GET /api/examples
 * @summary Get all examples
 * @tags Examples
 * @return {array<Example>} 200 - List of examples retrieved successfully
 * @return {object} 400 - Bad request
 */
export const getAll = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data, error } = await supabase
      .from('examples')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 400);

    sendSuccess(res, data, 'Examples retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/examples/{id}
 * @summary Get example by ID
 * @tags Examples
 * @param {string} id.path.required - Example ID
 * @return {Example} 200 - Example retrieved successfully
 * @return {object} 404 - Example not found
 * @return {object} 400 - Bad request
 */
export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('examples')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new AppError(error.message, 404);

    sendSuccess(res, data, 'Example retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/examples
 * @summary Create new example
 * @tags Examples
 * @security BearerAuth
 * @param {CreateExampleRequest} request.body.required - Example information
 * @return {Example} 201 - Example created successfully
 * @return {object} 400 - Bad request
 * @return {object} 401 - Unauthorized
 */
export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data, error } = await supabase
      .from('examples')
      .insert([{ ...req.body, user_id: req.user?.id }])
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);

    sendSuccess(res, data, 'Example created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/examples/{id}
 * @summary Update example
 * @tags Examples
 * @security BearerAuth
 * @param {string} id.path.required - Example ID
 * @param {CreateExampleRequest} request.body.required - Updated example information
 * @return {Example} 200 - Example updated successfully
 * @return {object} 400 - Bad request
 * @return {object} 401 - Unauthorized
 */
export const update = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('examples')
      .update(req.body)
      .eq('id', id)
      .eq('user_id', req.user?.id)
      .select()
      .single();

    if (error) throw new AppError(error.message, 400);

    sendSuccess(res, data, 'Example updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/examples/{id}
 * @summary Delete example
 * @tags Examples
 * @security BearerAuth
 * @param {string} id.path.required - Example ID
 * @return {object} 200 - Example deleted successfully
 * @return {object} 400 - Bad request
 * @return {object} 401 - Unauthorized
 */
export const remove = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('examples')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user?.id);

    if (error) throw new AppError(error.message, 400);

    sendSuccess(res, null, 'Example deleted successfully');
  } catch (error) {
    next(error);
  }
};
