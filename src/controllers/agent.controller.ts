import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { getAIService } from '../services/ai.service';
import { AgentDebtsRequest, ParsedDebtIntent } from '../models/agent.model';
import { DEBT_PARSER_SYSTEM_PROMPT } from '../prompts/debt-parser.prompt';
import { TransactionService } from '../services/transaction.service';
import { CreateTransactionDTO, TransactionResponse } from '../models/transaction.model';
import { AppError } from '../middleware/errorHandler';

// Initialize transaction service
const transactionService = TransactionService.withSupabase();

/**
 * Response type for agent debt operations
 */
interface AgentDebtResponse {
  parsed_intent: ParsedDebtIntent;
  action_result: {
    action: ParsedDebtIntent['action'];
    transaction: TransactionResponse | null;
    message: string;
  };
}

/**
 * Handle upsert_debt action
 * Creates a new debt or accumulates to existing debt for the same debtor
 */
async function handleUpsertDebt(parsedIntent: ParsedDebtIntent): Promise<AgentDebtResponse['action_result']> {
  const payload: CreateTransactionDTO = {
    type: 'debts',
    debtor_name: parsedIntent.debtor_name,
    nominal: parsedIntent.nominal,
    note: parsedIntent.original_prompt,
  };

  const transaction = await transactionService.create(payload, { upsert: true });

  return {
    action: 'upsert_debt',
    transaction,
    message: `Hutang untuk ${parsedIntent.debtor_name} berhasil dicatat sebesar ${parsedIntent.nominal}`,
  };
}

/**
 * Handle get_debt action
 * Retrieves debt information for a specific debtor
 */
async function handleGetDebt(parsedIntent: ParsedDebtIntent): Promise<AgentDebtResponse['action_result']> {
  const transaction = await transactionService.findDebtByDebtorName(parsedIntent.debtor_name);

  if (!transaction) {
    return {
      action: 'get_debt',
      transaction: null,
      message: `Tidak ada hutang yang tercatat untuk ${parsedIntent.debtor_name}`,
    };
  }

  return {
    action: 'get_debt',
    transaction,
    message: `${parsedIntent.debtor_name} memiliki hutang sebesar ${transaction.nominal}`,
  };
}

/**
 * Handle repay_debt action
 * Marks a debt as repaid by converting it to an earning transaction
 */
async function handleRepayDebt(parsedIntent: ParsedDebtIntent): Promise<AgentDebtResponse['action_result']> {
  try {
    const transaction = await transactionService.repayDebtByDebtorName(parsedIntent.debtor_name);

    return {
      action: 'repay_debt',
      transaction,
      message: `Hutang ${parsedIntent.debtor_name} berhasil dilunaskan`,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('No debt found')) {
      throw new AppError(`Tidak ada hutang yang tercatat untuk ${parsedIntent.debtor_name}`, 404);
    }
    throw error;
  }
}

/**
 * POST /api/agent/debts
 * @summary Parse a natural language prompt about debts using AI and execute the action
 * @tags Agent
 * @param {AgentDebtsRequest} request.body.required - User prompt to parse
 * @return {AgentDebtResponse} 200 - Successfully processed debt action
 * @return {object} 400 - Validation error
 * @return {object} 404 - Debt not found
 * @return {object} 500 - AI service error
 */
export const parseDebtPrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { prompt } = req.body as AgentDebtsRequest;

    // Step 1: Parse the prompt using AI
    const aiService = getAIService();
    const parsedIntent: ParsedDebtIntent = await aiService.parseDebtPrompt(
      prompt,
      DEBT_PARSER_SYSTEM_PROMPT
    );

    // Log the AI-generated structured output to console
    console.log('=== AI Parsed Debt Intent ===');
    console.log(JSON.stringify(parsedIntent, null, 2));
    console.log('=============================');

    // Step 2: Execute the appropriate action based on parsed intent
    let actionResult: AgentDebtResponse['action_result'];

    switch (parsedIntent.action) {
      case 'upsert_debt':
        actionResult = await handleUpsertDebt(parsedIntent);
        break;
      case 'get_debt':
        actionResult = await handleGetDebt(parsedIntent);
        break;
      case 'repay_debt':
        actionResult = await handleRepayDebt(parsedIntent);
        break;
      default:
        throw new AppError(`Unknown action: ${parsedIntent.action}`, 400);
    }

    // Step 3: Return the response
    const response: AgentDebtResponse = {
      parsed_intent: parsedIntent,
      action_result: actionResult,
    };

    sendSuccess(res, response, actionResult.message);
  } catch (error) {
    next(error);
  }
};

