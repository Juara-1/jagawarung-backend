export const TRANSACTION_TYPES = ['spending', 'earning', 'debts'] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const isTransactionType = (value: string): value is TransactionType =>
  (TRANSACTION_TYPES as readonly string[]).includes(value as TransactionType);

export interface Transaction {
  id: string;
  debtor_name: string | null;
  note: string | null;
  type: TransactionType;
  nominal: number;
  invoice_data: any | null;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionResponse {
  id: string;
  nominal: number;
  debtor_name: string | null;
  invoice_url: string | null;
  invoice_data: any | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionDTO {
  debtor_name?: string | null;
  nominal: number;
  type: TransactionType;
  invoice_url?: string | null;
  invoice_data?: Record<string, any> | null;
  note?: string | null;
}

export interface UpdateTransactionDTO {
  debtor_name?: string | null;
  nominal?: number;
  type?: TransactionType;
  invoice_url?: string | null;
  invoice_data?: Record<string, any> | null;
  note?: string | null;
}

export interface PaginationInfo {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface PaginatedTransactionsResponse {
  transactions: TransactionResponse[];
  pagination: PaginationInfo;
}

export interface TransactionSummary {
  total_debts: number;
  total_spending: number;
  total_earning: number;
}

export type TransactionOrderField = 'created_at' | 'updated_at' | 'nominal';

export type TransactionOrderDirection = 'asc' | 'desc';

export interface TransactionListQueryParams {
  page?: string;
  per_page?: string;
  order_by?: string;
  order_direction?: string;
  note?: string;
  type?: string;
  created_from?: string;
  created_to?: string;
}

export interface TransactionFilterOptions {
  page: number;
  perPage: number;
  orderBy: TransactionOrderField;
  orderDirection: TransactionOrderDirection;
  note?: string;
  types?: TransactionType[];
  createdFrom?: string;
  createdTo?: string;
}