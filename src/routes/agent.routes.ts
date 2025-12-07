import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { agentRequestSchema } from '../validators/agent.schema';
import { processDebtPrompt } from '../controllers/agent.controller';

const router = Router();

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Agent request body
 * @typedef {object} TransactionAgentRequest
 * @property {string} prompt.required - Natural language prompt to process
 */

/**
 * Error response
 * @typedef {object} ErrorResponse
 * @property {boolean} success - Always false for error responses - false
 * @property {string} message - Error message describing what went wrong
 */

/**
 * Parsed intent from AI
 * @typedef {object} ParsedDebtIntent
 * @property {string} original_prompt - The original user prompt
 * @property {string} action - The identified action (upsert_debt, get_debt, repay_debt, insert_spending, insert_earning)
 * @property {string} debtor_name - Name of the debtor mentioned in the prompt
 * @property {number} nominal - The monetary amount mentioned in the prompt
 */

/**
 * Transaction record for agent response
 * @typedef {object} AgentTransaction
 * @property {string} id - Transaction ID
 * @property {number} nominal - Transaction amount
 * @property {string} debtor_name - Name of the debtor
 * @property {string} invoice_url - URL to invoice in storage
 * @property {object} invoice_data - Invoice metadata
 * @property {string} note - Transaction note
 * @property {string} type - Transaction type (spending, earning, debts)
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * Result of processing the debt action
 * @typedef {object} DebtActionResult
 * @property {string} action - The action that was performed
 * @property {AgentTransaction} transaction - The transaction record (null if not applicable)
 * @property {string} message - Human-readable result message
 */

/**
 * Agent response data
 * @typedef {object} TransactionAgentData
 * @property {ParsedDebtIntent} parsed_intent - The AI's parsed intent from the prompt
 * @property {DebtActionResult} action_result - The result of executing the action
 */

/**
 * Transaction agent response wrapper
 * @typedef {object} TransactionAgentResponse
 * @property {boolean} success - Whether the request was successful
 * @property {string} message - Response message
 * @property {TransactionAgentData} data - The agent response data
 */

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /api/agent/transactions
 * @summary Process a natural language prompt about debts using AI and execute the appropriate action, if possible
 * @tags Agent
 * @security BearerAuth
 * @param {TransactionAgentRequest} request.body.required - User prompt to process
 * @return {TransactionAgentResponse} 200 - Successfully processed debt prompt
 * @return {ErrorResponse} 400 - Validation error
 * @return {ErrorResponse} 404 - Debt not found
 * @return {ErrorResponse} 500 - AI service error
 */
router.post('/transactions', authenticate, validate(agentRequestSchema, 'body'), processDebtPrompt);

export default router;
