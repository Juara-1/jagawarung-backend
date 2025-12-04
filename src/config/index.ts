import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  // Test database configuration (separate from dev/prod)
  test: {
    supabase: {
      url: process.env.SUPABASE_TEST_URL || '',
      anonKey: process.env.SUPABASE_TEST_ANON_KEY || '',
      serviceRoleKey: process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || '',
    },
  },
};
