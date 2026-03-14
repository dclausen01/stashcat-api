export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status?: string;
  avatar?: string;
  public_key?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  joined_at: string;
  user?: User;
}
