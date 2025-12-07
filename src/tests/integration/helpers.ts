import request from 'supertest';
import app from '../../app';
import { cleanTestData, setupTestDb } from './testDb';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Integration test helper utilities
 * These provide common functionality for integration tests
 */

/**
 * Create a wrapper object with methods that include authentication
 * This is useful for testing protected endpoints
 */
export const createAuthenticatedRequest = (token: string) => {
  return {
    get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => request(app).put(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${token}`)
  };
};

/**
 * Create a test user and return their auth token
 * This is useful for tests that require authentication
 */
export const createTestUser = async (client: SupabaseClient, userData: any = {}) => {
  const defaultUserData = {
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    ...userData
  };

  // Create user in Supabase auth
  const { data: authData, error: authError } = await client.auth.admin.createUser({
    email: defaultUserData.email,
    password: defaultUserData.password,
    email_confirm: true,
    user_metadata: userData.metadata || {}
  });

  if (authError) {
    console.error('Error creating test user:', authError);
    throw authError;
  }

  if (!authData.user) {
    throw new Error('Failed to create test user');
  }

  // Sign in to get a valid JWT token
  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email: defaultUserData.email,
    password: defaultUserData.password
  });

  if (signInError) {
    console.error('Error signing in test user:', signInError);
    throw signInError;
  }

  return {
    user: authData.user,
    token: signInData.session?.access_token || '',
    session: signInData.session
  };
};

/**
 * Setup a complete test environment with database and authenticated user
 * This is a one-stop function for setting up integration tests
 */
export const setupIntegrationTest = async () => {
  // Setup test database
  const client = await setupTestDb();

  // Create a test user and get auth token
  const { user, token } = await createTestUser(client);

  // Create authenticated request helpers
  const authRequest = createAuthenticatedRequest(token);

  return {
    client,
    user,
    token,
    authRequest
  };
};

/**
 * Clean up after an integration test
 * This ensures tests don't interfere with each other
 */
export const cleanupIntegrationTest = async (client: SupabaseClient) => {
  await cleanTestData(client);
};

/**
 * Helper to test API responses with common assertions
 * This reduces code duplication in tests
 */
export const expectSuccessResponse = (response: any, expectedData?: any) => {
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('success', true);
  
  if (expectedData) {
    expect(response.body.data).toMatchObject(expectedData);
  }
  
  return response;
};

/**
 * Helper to test error responses with common assertions
 */
export const expectErrorResponse = (response: any, expectedStatus: number, expectedMessage?: string) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', false);
  
  if (expectedMessage) {
    expect(response.body.message).toContain(expectedMessage);
  }
  
  return response;
};

/**
 * Create test data for debts
 * This provides consistent test data for debt-related tests
 */
export const createTestDebt = (overrides: any = {}) => {
  return {
    debtor_name: 'Test Debtor',
    total_nominal: 100000,
    description: 'Test debt description',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    status: 'pending',
    ...overrides
  };
};