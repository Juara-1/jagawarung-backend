import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../../config';

/**
 * Test database utilities for integration testing
 * This provides a clean database environment for each test run
 */

// Create a Supabase client for testing using test configuration
export const createTestClient = (): SupabaseClient => {
  // Use test database configuration if available, fallback to main config
  const testConfig = config.test?.supabase || config.supabase;
  
  return createClient(
    testConfig.url,
    testConfig.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

/**
 * Clean all data from test tables
 * This ensures tests run in isolation
 */
export const cleanTestData = async (client: SupabaseClient): Promise<void> => {
  try {
    // Delete all data from test tables in correct order to respect foreign keys
    // Using gte with minimum UUID to match all records (neq with invalid UUID fails for UUID columns)
    await client.from('transactions').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    await client.from('debts').delete().gte('id', '00000000-0000-0000-0000-000000000000');

    // Clean up test users from auth (users with test email pattern)
    const { data: users } = await client.auth.admin.listUsers();
    if (users?.users) {
      for (const user of users.users) {
        if (user.email?.includes('test-') && user.email?.includes('@example.com')) {
          await client.auth.admin.deleteUser(user.id);
        }
      }
    }

    console.log('Test data cleaned successfully');
  } catch (error) {
    console.error('Error cleaning test data:', error);
    throw error;
  }
};

/**
 * Seed test data for integration tests
 * This provides consistent test data across test runs
 */
export const seedTestData = async (_client: SupabaseClient): Promise<void> => {
  try {
    // Add any test data you need for your integration tests
    // Example:
    // await client.from('users').insert([
    //   { id: 'test-user-1', name: 'Test User 1', email: 'test1@example.com' },
    //   { id: 'test-user-2', name: 'Test User 2', email: 'test2@example.com' }
    // ]);
    
    console.log('Test data seeded successfully');
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
};

/**
 * Create a test database connection with proper isolation
 */
export const setupTestDb = async (): Promise<SupabaseClient> => {
  const client = createTestClient();
  
  // Verify that the debts table exists
  const { error: tableCheckError } = await client
    .from('debts')
    .select('*')
    .limit(0);
  
  if (tableCheckError && tableCheckError.message.includes('does not exist')) {
    throw new Error(
      '❌ The "debts" table does not exist in your test database.\n' +
      'Please create the table schema by running the SQL commands in:\n' +
      'src/tests/integration/README.md\n\n' +
      'Or ensure your test database has the same schema as your development database.'
    );
  }
  
  // Clean any existing test data
  await cleanTestData(client);
  
  // Seed fresh test data
  await seedTestData(client);
  
  return client;
};