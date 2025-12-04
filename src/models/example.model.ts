export interface Example {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExampleDTO {
  name: string;
  description?: string;
}

export interface UpdateExampleDTO {
  name?: string;
  description?: string;
}
