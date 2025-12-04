import request from 'supertest';
import app from '../app';

// Mock Supabase before importing controllers
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '../config/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('Debt Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/debts/upsert', () => {
    it('should create a new debt', async () => {
      const mockDebt = {
        id: 'test-id',
        debtor_name: 'John Doe',
        total_nominal: 150000.50,
        created_at: '2025-12-05T00:00:00.000Z',
        updated_at: '2025-12-05T00:00:00.000Z',
      };

      // Mock the Supabase chain: from().upsert().select().single()
      const mockSingle = jest.fn().mockResolvedValue({ data: mockDebt, error: null });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockUpsert = jest.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from = jest.fn().mockReturnValue({ upsert: mockUpsert });

      const newDebt = {
        debtorName: 'John Doe',
        totalNominal: 150000.50,
      };

      const response = await request(app)
        .post('/api/debts/upsert')
        .send(newDebt)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        debtor_name: 'John Doe',
        total_nominal: 150000.50,
      });
    });

    it('should return 400 for missing debtorName', async () => {
      const response = await request(app)
        .post('/api/debts/upsert')
        .send({ totalNominal: 100000 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should return 400 for invalid totalNominal', async () => {
      const response = await request(app)
        .post('/api/debts/upsert')
        .send({ debtorName: 'Test', totalNominal: -100 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('non-negative');
    });
  });

  describe('GET /api/debts', () => {
    it('should get debt by name', async () => {
      const mockDebt = {
        id: 'test-id',
        debtor_name: 'Test User',
        total_nominal: 50000,
        created_at: '2025-12-05T00:00:00.000Z',
        updated_at: '2025-12-05T00:00:00.000Z',
      };

      // Mock the Supabase chain
      const mockSingle = jest.fn().mockResolvedValue({ data: mockDebt, error: null });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = jest.fn().mockReturnValue({ select: mockSelect });

      const response = await request(app)
        .get('/api/debts?debtorName=Test%20User')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.debtor_name).toBe('Test User');
      expect(response.body.data.total_nominal).toBe(50000);
    });

    it('should return 404 for non-existent debt', async () => {
      // Mock not found error
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      });
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = jest.fn().mockReturnValue({ select: mockSelect });

      const response = await request(app)
        .get('/api/debts?debtorName=NonExistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing debtorName parameter', async () => {
      const response = await request(app)
        .get('/api/debts')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/debts', () => {
    it('should delete debt by name', async () => {
      const mockDebt = {
        id: 'test-id',
        debtor_name: 'Delete Me',
        total_nominal: 25000,
        created_at: '2025-12-05T00:00:00.000Z',
        updated_at: '2025-12-05T00:00:00.000Z',
      };

      // Mock the Supabase chain
      const mockSelect = jest.fn().mockResolvedValue({ data: [mockDebt], error: null });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = jest.fn().mockReturnValue({ delete: mockDelete });

      const response = await request(app)
        .delete('/api/debts?debtorName=Delete%20Me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.debtor_name).toBe('Delete Me');
    });

    it('should return 404 for non-existent debt', async () => {
      // Mock empty result (no debt found)
      const mockSelect = jest.fn().mockResolvedValue({ data: [], error: null });
      const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
      const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
      mockSupabase.from = jest.fn().mockReturnValue({ delete: mockDelete });

      const response = await request(app)
        .delete('/api/debts?debtorName=NonExistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing debtorName parameter', async () => {
      const response = await request(app)
        .delete('/api/debts')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});