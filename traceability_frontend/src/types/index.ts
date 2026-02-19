export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'QA' | 'FARMER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface DashboardMetrics {
  active_batches: {
    draft: number;
    locked: number;
    total: number;
  };
  pending_coas: number;
}

export interface Farmer {
  id: string;
  name: string;
  contact_number: string;
  is_active: boolean;
}

export interface Farm {
  id: string;
  farmer_id: string;
  location: string;
  google_drive_url: string;
}

export interface Vendor {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  location?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
}

export interface Batch {
  id: string;
  batch_code: string;
  product_id: string;
  status: 'DRAFT' | 'LOCKED';
  blockchain_hash?: string;
  locked_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: string;
  action: string;
  details?: Record<string, any>;
  timestamp: string;
}
