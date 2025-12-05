import { Response } from 'express';
import { PaginationInfo } from '../models/transaction.model';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T> {
  pagination: PaginationInfo;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendPaginatedSuccess = <T>(
  res: Response,
  data: T,
  pagination: PaginationInfo,
  message: string = 'Success',
  statusCode: number = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 400
): Response => {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
};
