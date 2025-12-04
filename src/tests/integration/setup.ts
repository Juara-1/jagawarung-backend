import { config } from '../../config';

// Set test environment variables
process.env.NODE_ENV = 'test';

// Use test database configuration if available, otherwise use main config
if (config.test?.supabase?.url) {
  process.env.SUPABASE_URL = config.test.supabase.url;
  process.env.SUPABASE_ANON_KEY = config.test.supabase.anonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = config.test.supabase.serviceRoleKey;
  console.log('✅ Using separate test database configuration');
} else {
  console.warn(
    '⚠️  Test database configuration not found. Using main database configuration.\n' +
    'It is recommended to set SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY, and SUPABASE_TEST_SERVICE_ROLE_KEY for safety.'
  );
}

// Global test timeout for integration tests
jest.setTimeout(30000);

// Setup and teardown hooks for integration tests
beforeAll(async () => {
  // Global setup for integration tests
  // This could include:
  // - Starting a test database instance
  // - Running migrations
  // - Seeding test data
  console.log('Setting up integration test environment...');
});

afterAll(async () => {
  // Global cleanup for integration tests
  // This could include:
  // - Stopping test database instance
  // - Cleaning up test data
  console.log('Cleaning up integration test environment...');
});

beforeEach(async () => {
  // Reset test data before each test
  // This ensures tests are isolated from each other
});

afterEach(async () => {
  // Clean up after each test if needed
});