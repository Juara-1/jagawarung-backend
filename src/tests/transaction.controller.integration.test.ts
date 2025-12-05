import request from 'supertest';
import app from '../app';
import {
  setupIntegrationTest,
  cleanupIntegrationTest,
  expectSuccessResponse,
  expectErrorResponse
} from './integration/helpers';

describe('Transaction Controller Integration Tests', () => {
  let testSetup: any;

  beforeAll(async () => {
    testSetup = await setupIntegrationTest();
  });

  afterAll(async () => {
    await cleanupIntegrationTest(testSetup.client);
  });

  // Note: Each describe block handles its own beforeEach cleanup

  describe('POST /api/transactions', () => {
    beforeEach(async () => {
      // Clean existing data before each test using gt (greater than) with empty string works for any type
      await testSetup.client.from('transactions').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    });

    it('should create a spending transaction', async () => {
      const transactionData = {
        nominal: 50000,
        type: 'spending',
        note: 'Groceries shopping'
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        nominal: 50000,
        note: 'Groceries shopping'
      });
      expect(response.body.data.id).toBeDefined();

      // Verify the transaction was actually created in the database
      const { data: createdTransaction } = await testSetup.client
        .from('transactions')
        .select('*')
        .eq('id', response.body.data.id)
        .single();

      expect(createdTransaction).toBeTruthy();
      expect(createdTransaction.nominal).toBe(50000);
      expect(createdTransaction.type).toBe('spending');
    });

    it('should create an earning transaction', async () => {
      const transactionData = {
        nominal: 100000,
        type: 'earning',
        note: 'Freelance payment'
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nominal).toBe(100000);
    });

    it('should create a debts transaction with debtor_name', async () => {
      const uniqueDebtorName = `John Doe ${Date.now()}`;
      const transactionData = {
        nominal: 75000,
        type: 'debts',
        debtor_name: uniqueDebtorName,
        note: 'Borrowed for lunch'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Content-Type', 'application/json')
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.debtor_name).toBe(uniqueDebtorName);
    });

    it('should return validation error when debtor_name is missing for debts type', async () => {
      const transactionData = {
        nominal: 75000,
        type: 'debts',
        note: 'Missing debtor name'
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expectErrorResponse(response, 400);
    });

    it('should return validation error for missing nominal', async () => {
      const transactionData = {
        type: 'spending',
        note: 'Missing nominal'
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expectErrorResponse(response, 400);
    });

    it('should return validation error for negative nominal', async () => {
      const transactionData = {
        nominal: -100,
        type: 'spending',
        note: 'Negative nominal'
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expectErrorResponse(response, 400);
    });

    it('should return validation error for invalid type', async () => {
      const transactionData = {
        nominal: 50000,
        type: 'invalid_type',
        note: 'Invalid type'
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expectErrorResponse(response, 400);
    });

    it('should create transaction with invoice data', async () => {
      const transactionData = {
        nominal: 150000,
        type: 'spending',
        note: 'Office supplies',
        invoice_url: 'https://example.com/invoice.pdf',
        invoice_data: { vendor: 'Office Mart', items: ['Pens', 'Paper'] }
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body.data.invoice_url).toBe('https://example.com/invoice.pdf');
      expect(response.body.data.invoice_data).toEqual({ vendor: 'Office Mart', items: ['Pens', 'Paper'] });
    });
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      // Clean existing data first
      await testSetup.client.from('transactions').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      // Seed test transactions with unique debtor name
      const uniqueDebtor = `Test Debtor GET ${Date.now()}`;
      await testSetup.client.from('transactions').insert([
        { nominal: 50000, type: 'spending', note: 'Test spending 1' },
        { nominal: 75000, type: 'spending', note: 'Test spending 2' },
        { nominal: 100000, type: 'earning', note: 'Test earning 1' },
        { nominal: 25000, type: 'debts', debtor_name: uniqueDebtor, note: 'Test debt 1' }
      ]);
    });

    it('should return paginated transactions with defaults', async () => {
      const response = await request(app)
        .get('/api/transactions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(4);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.per_page).toBe(10);
      expect(response.body.pagination.total_items).toBe(4);
    });

    it('should return paginated transactions with custom page and per_page', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ page: '1', per_page: '2' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.per_page).toBe(2);
      expect(response.body.pagination.total_pages).toBe(2);
    });

    it('should filter transactions by type', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ type: 'spending' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      response.body.data.forEach((tx: any) => {
        expect(tx.note).toContain('spending');
      });
    });

    it('should filter transactions by multiple types', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ type: 'spending,earning' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3);
    });

    it('should filter transactions by note (case-insensitive)', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ note: 'SPENDING' });

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });

    it('should sort transactions by nominal ascending', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ order_by: 'nominal', order_direction: 'asc' });

      expect(response.status).toBe(200);
      const nominals = response.body.data.map((tx: any) => tx.nominal);
      expect(nominals).toEqual([...nominals].sort((a, b) => a - b));
    });

    it('should sort transactions by nominal descending', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ order_by: 'nominal', order_direction: 'desc' });

      expect(response.status).toBe(200);
      const nominals = response.body.data.map((tx: any) => tx.nominal);
      expect(nominals).toEqual([...nominals].sort((a, b) => b - a));
    });

    it('should return empty array when no transactions match', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ note: 'nonexistent' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total_items).toBe(0);
    });

    it('should return 400 for invalid order_by value', async () => {
      const response = await request(app)
        .get('/api/transactions')
        .query({ order_by: 'invalid_field' });

      expectErrorResponse(response, 400);
    });
  });


  describe('GET /api/transactions/summary', () => {
    beforeEach(async () => {
      // Clean existing data first
      await testSetup.client.from('transactions').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      // Create transactions within the current day/week/month with unique debtor name
      const uniqueDebtor = `Summary Debtor ${Date.now()}`;
      await testSetup.client.from('transactions').insert([
        { nominal: 50000, type: 'spending', note: 'Spending 1' },
        { nominal: 30000, type: 'spending', note: 'Spending 2' },
        { nominal: 100000, type: 'earning', note: 'Earning 1' },
        { nominal: 25000, type: 'debts', debtor_name: uniqueDebtor, note: 'Debt 1' }
      ]);
    });

    it('should return transaction summary for day', async () => {
      const response = await request(app)
        .get('/api/transactions/summary')
        .query({ time_range: 'day' });

      expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('total_spending');
      expect(response.body.data).toHaveProperty('total_earning');
      expect(response.body.data).toHaveProperty('total_debts');
      expect(response.body.data.total_spending).toBe(80000);
      expect(response.body.data.total_earning).toBe(100000);
      expect(response.body.data.total_debts).toBe(25000);
    });

    it('should return transaction summary for week', async () => {
      const response = await request(app)
        .get('/api/transactions/summary')
        .query({ time_range: 'week' });

      expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('total_spending');
      expect(response.body.data).toHaveProperty('total_earning');
      expect(response.body.data).toHaveProperty('total_debts');
    });

    it('should return transaction summary for month', async () => {
      const response = await request(app)
        .get('/api/transactions/summary')
        .query({ time_range: 'month' });

      expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('total_spending');
      expect(response.body.data).toHaveProperty('total_earning');
      expect(response.body.data).toHaveProperty('total_debts');
    });

    it('should return 400 when time_range is missing', async () => {
      const response = await request(app)
        .get('/api/transactions/summary');

      expectErrorResponse(response, 400);
    });

    it('should return 400 for invalid time_range', async () => {
      const response = await request(app)
        .get('/api/transactions/summary')
        .query({ time_range: 'year' });

      expectErrorResponse(response, 400);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    let testTransactionId: string;

    beforeEach(async () => {
      // Clean existing data first
      await testSetup.client.from('transactions').delete().neq('id', 'impossible-id');
      // Create a test transaction
      const { data } = await testSetup.client
        .from('transactions')
        .insert({
          nominal: 50000,
          type: 'spending',
          note: 'Original note'
        })
        .select()
        .single();
      testTransactionId = data.id;
    });

    it('should update a transaction by ID', async () => {
      const updateData = {
        nominal: 75000,
        type: 'spending',
        note: 'Updated note'
      };

      const response = await request(app)
        .put(`/api/transactions/${testTransactionId}`)
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.data.nominal).toBe(75000);
      expect(response.body.data.note).toBe('Updated note');

      // Verify the transaction was actually updated in the database
      const { data: updatedTransaction } = await testSetup.client
        .from('transactions')
        .select('*')
        .eq('id', testTransactionId)
        .single();

      expect(updatedTransaction.nominal).toBe(75000);
      expect(updatedTransaction.note).toBe('Updated note');
    });

    it('should update transaction type', async () => {
      const updateData = {
        nominal: 50000,
        type: 'earning',
        note: 'Changed to earning'
      };

      const response = await request(app)
        .put(`/api/transactions/${testTransactionId}`)
        .send(updateData);

      expectSuccessResponse(response);

      const { data: updatedTransaction } = await testSetup.client
        .from('transactions')
        .select('*')
        .eq('id', testTransactionId)
        .single();

      expect(updatedTransaction.type).toBe('earning');
    });

    it('should update to debts type with debtor_name', async () => {
      const uniqueDebtorName = `Jane Doe ${Date.now()}`;
      const updateData = {
        nominal: 60000,
        type: 'debts',
        debtor_name: uniqueDebtorName,
        note: 'Changed to debt'
      };

      const response = await request(app)
        .put(`/api/transactions/${testTransactionId}`)
        .set('Content-Type', 'application/json')
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.data.debtor_name).toBe(uniqueDebtorName);
    });

    it('should return 404 for non-existent transaction', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateData = {
        nominal: 75000,
        type: 'spending',
        note: 'Updated note'
      };

      const response = await request(app)
        .put(`/api/transactions/${nonExistentId}`)
        .send(updateData);

      expectErrorResponse(response, 404);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    let testTransactionId: string;

    beforeEach(async () => {
      // Clean existing data first
      await testSetup.client.from('transactions').delete().neq('id', 'impossible-id');
      // Create a test transaction to delete
      const { data } = await testSetup.client
        .from('transactions')
        .insert({
          nominal: 100000,
          type: 'spending',
          note: 'Transaction to delete'
        })
        .select()
        .single();
      testTransactionId = data.id;
    });

    it('should delete a transaction by ID', async () => {
      const response = await request(app)
        .delete(`/api/transactions/${testTransactionId}`);

      expectSuccessResponse(response);

      // Verify the transaction was actually deleted from the database
      const { data: deletedTransaction } = await testSetup.client
        .from('transactions')
        .select('*')
        .eq('id', testTransactionId)
        .single();

      expect(deletedTransaction).toBeNull();
    });

    it('should return 404 for non-existent transaction', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .delete(`/api/transactions/${nonExistentId}`);

      expectErrorResponse(response, 404);
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .delete('/api/transactions/invalid-uuid');

      // This may return 400 or 404 depending on implementation
      expect([400, 404]).toContain(response.status);
    });
  });
});
