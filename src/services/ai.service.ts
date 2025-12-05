import fetch, { Response } from 'node-fetch';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

const {
  provider,
  baseUrl,
  apiKey,
  defaultModel,
  requestTimeoutMs,
} = config.ai;

interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AiRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

interface AiResponseChoice {
  index: number;
  message: AiMessage;
  finish_reason?: string;
}

interface AiResponseBody {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: AiResponseChoice[];
}

const buildHeaders = () => {
  if (!apiKey) {
    throw new AppError('AI provider API key is not configured', 500);
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
};

const handleErrorResponse = async (response: Response): Promise<never> => {
  let errorBody: any = {};
  try {
    errorBody = await response.json();
  } catch (err) {
    // ignore json parse errors
  }

  const message =
    errorBody?.error?.message ||
    errorBody?.message ||
    `AI provider ${provider} responded with status ${response.status}`;

  throw new AppError(message, response.status);
};

export const sendPrompt = async (
  prompt: string,
  options: AiRequestOptions = {}
) => {
  const model = options.model || defaultModel;

  const body = {
    model,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens,
    messages: [
      options.systemPrompt
        ? { role: 'system', content: options.systemPrompt }
        : null,
      { role: 'user', content: prompt },
    ].filter(Boolean),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return handleErrorResponse(response);
    }

    const data: AiResponseBody = await response.json() as AiResponseBody;

    if (!data?.choices?.length) {
      throw new AppError('AI provider returned no choices', 502);
    }

    return data.choices[0].message;
  } catch (error: any) {
    clearTimeout(timeout);

    if (error.name === 'AbortError') {
      throw new AppError('AI provider request timed out', 504);
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(error.message || 'Failed to call AI provider', 500);
  }
};
