export interface Debt {
  id: string;
  debtor_name: string;
  total_nominal: number;
  created_at: string;
  updated_at: string;
}

export interface UpsertDebtDTO {
  debtorName: string;
  totalNominal: number;
}
