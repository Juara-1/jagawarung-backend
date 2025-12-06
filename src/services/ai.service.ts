import OpenAI from 'openai';
import { config } from '../config';
import { ParsedDebtIntent, AICompletionOptions } from '../models/agent.model';
import { DEBT_PARSER_RESPONSE_SCHEMA } from '../prompts/debt-parser.prompt';

/**
 * AI Service for OpenAI-compatible API interactions
 * 
 * Uses the OpenAI SDK to communicate with OpenAI-compatible endpoints
 * configured via environment variables in config.ai
 */
export class AIService {
  private client: OpenAI;
  private defaultModel: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.ai.apiKey,
      baseURL: config.ai.baseUrl,
      timeout: config.ai.requestTimeoutMs,
    });
    this.defaultModel = config.ai.defaultModel;
  }

  /**
   * Parse a user prompt about debts and return structured data
   * 
   * @param userPrompt - The user's natural language prompt
   * @param systemPrompt - The system prompt to guide the AI
   * @returns Parsed debt intent with action, debtor name, and nominal
   */
  async parseDebtPrompt(
    userPrompt: string,
    systemPrompt: string
  ): Promise<ParsedDebtIntent> {
    const response = await this.client.chat.completions.create({
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'parsed_debt_intent',
          strict: true,
          schema: DEBT_PARSER_RESPONSE_SCHEMA,
        },
      },
      temperature: 0, // Deterministic output for consistent parsing
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('AI returned empty response');
    }

    const parsed = JSON.parse(content) as ParsedDebtIntent;
    
    // Ensure original_prompt is set correctly
    parsed.original_prompt = userPrompt;
    
    return parsed;
  }

  /**
   * Generic method for AI completions with structured JSON output
   * Can be extended for other use cases
   * 
   * @param options - Completion options including prompts and model settings
   * @returns The parsed JSON response from the AI
   */
  async getStructuredCompletion<T>(
    options: AICompletionOptions,
    responseSchema: Record<string, unknown>
  ): Promise<T> {
    const { systemPrompt, userPrompt, model, temperature = 0 } = options;

    const response = await this.client.chat.completions.create({
      model: model || this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'structured_response',
          strict: true,
          schema: responseSchema,
        },
      },
      temperature,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('AI returned empty response');
    }

    return JSON.parse(content) as T;
  }
}

// Singleton instance for convenience
let aiServiceInstance: AIService | null = null;

// Get or create the AI service singleton
export const getAIService = (): AIService => {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
};

