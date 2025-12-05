import request from 'supertest';
import app from '../app';

jest.mock('../services/ai.service', () => ({
  sendPrompt: jest.fn(),
}));

import { sendPrompt } from '../services/ai.service';

const mockedSendPrompt = sendPrompt as jest.MockedFunction<typeof sendPrompt>;

describe('Agent Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/agent', () => {
    it('should return AI response when prompt is valid', async () => {
      mockedSendPrompt.mockResolvedValue({
        role: 'assistant',
        content: 'Hello from AI',
      });

      const response = await request(app)
        .post('/api/agent')
        .send({ prompt: 'Hi there' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Hello from AI');
      expect(mockedSendPrompt).toHaveBeenCalledWith('Hi there', {
        model: undefined,
        temperature: undefined,
        maxTokens: undefined,
        systemPrompt: undefined,
      });
    });

    it('should return 400 when prompt is missing', async () => {
      const response = await request(app)
        .post('/api/agent')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should bubble up AI provider errors', async () => {
      mockedSendPrompt.mockRejectedValue(new Error('AI down'));

      const response = await request(app)
        .post('/api/agent')
        .send({ prompt: 'Ping?' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});
