export interface Transaction {
  id: string;
  debtor_name: string | null;
  note: string | null;
  type: 'spending' | 'earning' | 'debts';
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