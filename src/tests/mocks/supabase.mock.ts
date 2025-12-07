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