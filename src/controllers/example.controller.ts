import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// GET /api/examples - Get all examples
export const getAll = async (
  req: Request,
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

// GET /api/examples/:id - Get example by ID
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

// POST /api/examples - Create new example
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

// PUT /api/examples/:id - Update example
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

// DELETE /api/examples/:id - Delete example
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
