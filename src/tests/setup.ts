import { config } from '../config';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = config.supabase.url;
process.env.SUPABASE_ANON_KEY = config.supabase.anonKey;
process.env.SUPABASE_SERVICE_ROLE_KEY = config.supabase.serviceRoleKey;

// Global test timeout
jest.setTimeout(10000);