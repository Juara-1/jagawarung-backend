import { getAIService } from './ai.service';
import { TransactionService } from './transaction.service';
import { ParsedDebtIntent } from '../models/agent.model';
import { CreateTransactionDTO, TransactionResponse } from '../models/transaction.model';
import { DEBT_PARSER_SYSTEM_PROMPT } from '../prompts/debt-parser.prompt';
import { AppError } from '../middleware/errorHandler';

/**
 * Result of processing a debt action
 */
export interface DebtActionResult {
  action: ParsedDebtIntent['action'];
  transaction: TransactionResponse | null;
  message: string;
}

/**
 * Response from processing a debt prompt
 */
export interface ProcessDebtPromptResponse {
  parsed_intent: ParsedDebtIntent;
  action_result: DebtActionResult;
}

/**
 * Agent Service
 * 
 * Orchestrates AI-powered agent workflows, including:
 * - Parsing natural language prompts using AI
 * - Executing appropriate business actions based on parsed intent
 */
export class AgentService {
  constructor(
    private readonly transactionService: TransactionService
  ) {}

  /**
   * Create an AgentService instance with default dependencies
   */
  static withDefaults(): AgentService {
    return new AgentService(TransactionService.withSupabase());
  }

  /**
   * Process a debt-related prompt from natural language to action execution
   * 
   * @param prompt - The user's natural language prompt
   * @returns Parsed intent and action result
   */
  async processDebtPrompt(prompt: string): Promise<ProcessDebtPromptResponse> {
    // Step 1: Parse the prompt using AI
    const aiService = getAIService();
    const parsedIntent = await aiService.parseDebtPrompt(prompt, DEBT_PARSER_SYSTEM_PROMPT);

    // Step 2: Execute the appropriate action based on parsed intent
    let actionResult: DebtActionResult;

    switch (parsedIntent.action) {
      case 'upsert_debt':
        actionResult = await this.handleUpsertDebt(parsedIntent);
        break;
      case 'get_debt':
        actionResult = await this.handleGetDebt(parsedIntent);
        break;
      case 'repay_debt':
        actionResult = await this.handleRepayDebt(parsedIntent);
        break;
      case 'insert_spending':
        actionResult = await this.handleInsertSpending(parsedIntent);
        break;
      case 'insert_earning':
        actionResult = await this.handleInsertEarning(parsedIntent);
        break;
      default:
        throw new AppError(`Unknown action: ${parsedIntent.action}`, 400);
    }

    return {
      parsed_intent: parsedIntent,
      action_result: actionResult,
    };
  }

  /**
   * Handle upsert_debt action
   * Creates a new debt or accumulates to existing debt for the same debtor
   */
  private async handleUpsertDebt(parsedIntent: ParsedDebtIntent): Promise<DebtActionResult> {
    const payload: CreateTransactionDTO = {
      type: 'debts',
      debtor_name: parsedIntent.debtor_name,
      nominal: parsedIntent.nominal,
      note: parsedIntent.original_prompt,
    };

    const transaction = await this.transactionService.create(payload, { upsert: true });

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
  private async handleGetDebt(parsedIntent: ParsedDebtIntent): Promise<DebtActionResult> {
    const transaction = await this.transactionService.findDebtByDebtorName(parsedIntent.debtor_name);

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
  private async handleRepayDebt(parsedIntent: ParsedDebtIntent): Promise<DebtActionResult> {
    try {
      const transaction = await this.transactionService.repayDebtByDebtorName(parsedIntent.debtor_name);

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
   * Handle insert_spending action
   * Creates a new spending transaction
   */
  private async handleInsertSpending(parsedIntent: ParsedDebtIntent): Promise<DebtActionResult> {
      const payload: CreateTransactionDTO = {
        type: 'spending',
        nominal: parsedIntent.nominal,
        note: parsedIntent.original_prompt,
      };

      const transaction = await this.transactionService.create(payload, { upsert: false });

      return {
        action: 'insert_spending',
        transaction,
        message: `Pengeluaran sebesar ${parsedIntent.nominal} berhasil dicatat`,
      };
  }

  /**
   * Handle insert_earning action
   * Creates a new earning transaction
   */
  private async handleInsertEarning(parsedIntent: ParsedDebtIntent): Promise<DebtActionResult> {
      const payload: CreateTransactionDTO = {
        type: 'earning',
        nominal: parsedIntent.nominal,
        note: parsedIntent.original_prompt,
      };

      const transaction = await this.transactionService.create(payload, { upsert: false });

      return {
        action: 'insert_earning',
        transaction,
        message: `Pemasukan sebesar ${parsedIntent.nominal} berhasil dicatat`,
      };
    }
}

