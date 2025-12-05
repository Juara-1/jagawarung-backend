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
  debtorName?: string | null;
  nominal: number;
  type: TransactionType;
  invoiceUrl?: string | null;
  invoiceData?: Record<string, any> | null;
  note?: string | null;
}

export interface UpdateTransactionDTO {
  debtorName?: string | null;
  nominal?: number;
  type?: TransactionType;
  invoiceUrl?: string | null;
  invoiceData?: Record<string, any> | null;
  note?: string | null;
}

export interface PaginationInfo {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
}

export interface PaginatedTransactionsResponse {
  success: boolean;
  message: string;
  data: TransactionResponse[];
  pagination: PaginationInfo;
}

export interface TransactionSummary {
  total_debts: number;
  total_spending: number;
  total_earning: number;
}