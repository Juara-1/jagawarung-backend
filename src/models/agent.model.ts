/**
 * Agent module model definitions
 * Types and interfaces for AI-powered agent endpoints
 */

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Request body for POST /api/agent/debts
 */
export interface AgentDebtsRequest {
  prompt: string;
}

// ============================================================================
// AI Parsed Intent Types
// ============================================================================

/**
 * Possible actions the AI can identify from a debt-related prompt
 */
export type DebtAction = 'repay_debt' | 'get_debt' | 'upsert_debt';

/**
 * Structured output from AI parsing a debt-related prompt
 */
export interface ParsedDebtIntent {
  /** The original prompt from the request body */
  original_prompt: string;
  /** The identified action to perform */
  action: DebtAction;
  /** Name of the debtor mentioned in the prompt */
  debtor_name: string;
  /** The monetary amount mentioned in the prompt */
  nominal: number;
}

// ============================================================================
// AI Service Types
// ============================================================================

// Options for AI completion requests
export interface AICompletionOptions {
  /** System prompt to guide the AI */
  systemPrompt: string;
  /** User message/prompt */
  userPrompt: string;
  /** Optional model override (defaults to config.ai.defaultModel) */
  model?: string;
  /** Optional temperature (defaults to 0 for deterministic output) */
  temperature?: number;
}

