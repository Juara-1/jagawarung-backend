import request from 'supertest';
import app from '../app';
import {
  setupIntegrationTest,
  cleanupIntegrationTest,
  expectSuccessResponse,
  expectErrorResponse
} from './integration/helpers';

describe('Debt Controller Integration Tests', () => {
  let testSetup: any;

  beforeAll(async () => {
    // Setup test environment once before all tests
    testSetup = await setupIntegrationTest();
  });

  afterAll(async () => {
    // Clean up after all tests
    await cleanupIntegrationTest(testSetup.client);
  });

  beforeEach(async () => {
    // Clean test data before each test
    await testSetup.client.from('debts').delete().neq('id', 'impossible-id');
  });

  describe('POST /api/debts/upsert', () => {
    it('should create a new debt', async () => {
      const debtData = {
        debtorName: 'John Doe',
        totalNominal: 150000.50
      };

      const response = await request(app)
        .post('/api/debts/upsert')
        .send(debtData);

      expectSuccessResponse(response, {
        debtor_name: 'John Doe',
        total_nominal: 150000.50
      });

      // Verify the debt was actually created in the database
      const { data: createdDebt } = await testSetup.client
        .from('debts')
        .select('*')
        .eq('debtor_name', 'John Doe')
        .single();

      expect(createdDebt).toBeTruthy();
      expect(createdDebt.debtor_name).toBe('John Doe');
      expect(createdDebt.total_nominal).toBe(150000.50);
    });

    it('should update an existing debt when debtor_name exists', async () => {
      // First create a debt directly in the database
      await testSetup.client
        .from('debts')
        .insert({
          debtor_name: 'Jane Smith',
          total_nominal: 200000
        });

      // Then update it via API using same debtor_name
      const updateData = {
        debtorName: 'Jane Smith',
        totalNominal: 250000
      };

      const response = await request(app)
        .post('/api/debts/upsert')
        .send(updateData);

      expectSuccessResponse(response, {
        debtor_name: 'Jane Smith',
        total_nominal: 250000
      });

      // Verify the debt was actually updated in the database
      const { data: updatedDebt } = await testSetup.client
        .from('debts')
        .select('*')
        .eq('debtor_name', 'Jane Smith')
        .single();

      expect(updatedDebt.total_nominal).toBe(250000);
    });

    it('should return validation error for missing required fields', async () => {
      const invalidData = {
        // Missing debtorName and totalNominal
        description: 'Test debt without required fields'
      };

      const response = await request(app)
        .post('/api/debts/upsert')
        .send(invalidData);

      expectErrorResponse(response, 400);
    });

    it('should return validation error for negative totalNominal', async () => {
      const invalidData = {
        debtorName: 'Test Debtor',
        totalNominal: -100
      };

      const response = await request(app)
        .post('/api/debts/upsert')
        .send(invalidData);

      expectErrorResponse(response, 400);
    });
  });

  describe('GET /api/debts', () => {
    beforeEach(async () => {
      // Create a test debt
      await testSetup.client.from('debts').insert({
        debtor_name: 'Test Debtor',
        total_nominal: 100000
      });
    });

    it('should return a debt by debtor name', async () => {
      const response = await request(app)
        .get('/api/debts')
        .query({ debtorName: 'Test Debtor' });

      expectSuccessResponse(response, {
        debtor_name: 'Test Debtor',
        total_nominal: 100000
      });
    });

    it('should return 404 for non-existent debtor', async () => {
      const response = await request(app)
        .get('/api/debts')
        .query({ debtorName: 'Non Existent Debtor' });

      expectErrorResponse(response, 404);
    });

    it('should return 400 when debtorName query is missing', async () => {
      const response = await request(app)
        .get('/api/debts');

      expectErrorResponse(response, 400);
    });
  });

  describe('DELETE /api/debts', () => {
    beforeEach(async () => {
      // Create a test debt to delete
      await testSetup.client.from('debts').insert({
        debtor_name: 'Debtor to Delete',
        total_nominal: 750000
      });
    });

    it('should delete a debt by debtor name', async () => {
      const response = await request(app)
        .delete('/api/debts')
        .query({ debtorName: 'Debtor to Delete' });

      expectSuccessResponse(response);

      // Verify the debt was actually deleted
      const { data: deletedDebt } = await testSetup.client
        .from('debts')
        .select('*')
        .eq('debtor_name', 'Debtor to Delete')
        .single();

      expect(deletedDebt).toBeNull();
    });

    it('should return 404 when trying to delete non-existent debtor', async () => {
      const response = await request(app)
        .delete('/api/debts')
        .query({ debtorName: 'Non Existent Debtor' });

      expectErrorResponse(response, 404);
    });

    it('should return 400 when debtorName query is missing', async () => {
      const response = await request(app)
        .delete('/api/debts');

      expectErrorResponse(response, 400);
    });
  });
});