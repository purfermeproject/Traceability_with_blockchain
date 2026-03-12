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
  village: string;
  district: string;
  profile_photo_url?: string | null;
  about?: string | null;
  is_active: boolean;
}

export interface Farm {
  id: string;
  farmer_id: string;
  name: string;
  location_pin?: string | null;
  acreage?: string | null;
  npk_ratio?: string | null;
  farming_technology?: string | null;
}

export interface Vendor {
  id: string;
  company_name: string;
  city: string;
  state: string;
  gst_no?: string | null;
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
  forensic_report_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email: string;
  action: string;
  table_name: string;
  record_id?: string | null;
  details?: any;
  timestamp: string;
}

export type CropStage =
  'Ploughing' |
  'Sowing' |
  'Irrigation' |
  'Harvest' |
  'Processing' |
  'Storage' |
  'Damage' |
  'Other';

export interface CropCycle {
  id: string;
  farmer_id: string;
  farm_id?: string | null;
  crop_name: string;
  lot_reference_code: string;
  is_active: boolean;
  // Computed on frontend
  status?: string;
  start_date?: string;
  events?: CropEvent[];
}

export interface CropEvent {
  id: string;
  crop_cycle_id: string;
  stage_name: CropStage;
  event_date: string;
  description?: string | null;
  photo_urls?: string | null;
  photo_url_list: string[];
}
export interface Ingredient {
  id: string;
  name: string;
  type: string;
  requires_tracking: boolean;
  procurement_details?: string | null;
  key_benefits_json?: string | null;
}
