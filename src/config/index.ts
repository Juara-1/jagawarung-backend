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
  
  ai: {
    provider: process.env.AI_PROVIDER || 'openai-compatible',
    baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
    apiKey: process.env.AI_API_KEY || '',
    defaultModel: process.env.AI_MODEL || 'gpt-4o-mini',
    requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS || 30000),
  },

  mcp: {
    serverUrl: process.env.MCP_SERVER_URL || '',
    apiKey: process.env.MCP_API_KEY || '',
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
