import { Debt } from '../../models/debt.model';

// Mock Supabase client
export const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
      single: jest.fn(),
    })),
    upsert: jest.fn(() => ({
      select: jest.fn(),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(),
      })),
      select: jest.fn(),
    })),
  })),
};

// Mock response data
export const mockDebt: Debt = {
  id: 'test-id',
  debtor_name: 'Test User',
  total_nominal: 50000,
  created_at: '2025-12-05T00:00:00.000Z',
  updated_at: '2025-12-05T00:00:00.000Z',
};