// Belmarose Stock & Inventory Database & Domain Types

export type UserRole = 'admin' | 'manager' | 'staff';

export type StockTakeType = 'daily_opening' | 'daily_closing' | 'weekly_audit' | 'spot_check';
export type StockTakeStatus = 'in_progress' | 'completed' | 'cancelled';
export type DiscrepancyStatus = 'pending_review' | 'investigating' | 'resolved' | 'written_off';
export type WastageReason = 'spoilage' | 'spillage' | 'breakage' | 'complimentary' | 'bartender_error' | 'expired' | 'other';
export type POStatus = 'draft' | 'submitted' | 'partially_received' | 'received' | 'cancelled';
export type MovementType = 'purchase_receive' | 'sales_deduction' | 'wastage' | 'audit_adjustment' | 'initial_setup';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color_tag: string;
  created_at?: string;
}

export interface Vendor {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address?: string;
  gstin?: string;
  payment_terms: string;
  is_active: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  category?: Category;
  vendor_id?: string;
  vendor?: Vendor;
  uom: string; // 'BTL.' | 'CAN' | 'KEG' | 'CASE' | 'ML'
  cost_price: number;
  selling_price: number;
  current_stock: number;
  opening_stock: number;
  reorder_point: number;
  ideal_stock: number;
  min_order_qty: number;
  case_size: number;
  last_2week_sales: number;
  barcode?: string;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockTakeSession {
  id: string;
  session_code: string;
  type: StockTakeType;
  status: StockTakeStatus;
  conducted_by: string;
  notes?: string;
  started_at: string;
  completed_at?: string;
  items_count?: number;
  total_variance_cost?: number;
}

export interface StockTakeItem {
  id: string;
  session_id: string;
  product_id: string;
  product?: Product;
  system_stock: number;
  counted_stock: number;
  variance: number; // counted_stock - system_stock
  variance_cost: number;
  notes?: string;
}

export interface Discrepancy {
  id: string;
  product_id: string;
  product?: Product;
  stock_take_session_id?: string;
  date: string;
  expected_qty: number;
  actual_qty: number;
  variance: number;
  variance_value: number; // in INR
  status: DiscrepancyStatus;
  resolution_notes?: string;
  reviewed_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface WastageLog {
  id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  reason: WastageReason;
  cost_impact: number;
  logged_by: string;
  notes?: string;
  logged_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  product_id: string;
  product?: Product;
  ordered_qty: number;
  received_qty: number;
  unit_cost: number;
  total_cost: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor?: Vendor;
  status: POStatus;
  total_amount: number;
  budget_limit?: number;
  budget_exceeded: boolean;
  notes?: string;
  ordered_by: string;
  expected_date?: string;
  received_at?: string;
  created_at: string;
  items?: PurchaseOrderItem[];
}

export interface WeeklyOrderPlanItem {
  id: string;
  plan_id: string;
  product_id: string;
  product?: Product;
  stock_in_hand: number;
  last_2week_sales: number;
  suggested_qty: number; // velocity formula calculation
  requisition_qty: number;
  unit_cost: number;
  projected_stock_after: number;
  total_cost: number;
  notes?: string;
}

export interface WeeklyOrderPlan {
  id: string;
  plan_title: string;
  week_start: string;
  week_end: string;
  budget_limit: number;
  total_requisition_value: number;
  total_suggested_value: number;
  status: 'draft' | 'finalized' | 'converted_to_pos';
  created_by: string;
  created_at: string;
  items?: WeeklyOrderPlanItem[];
}

export interface StockMovement {
  id: string;
  product_id: string;
  product?: Product;
  movement_type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface DashboardMetrics {
  totalInventoryValue: number;
  totalProductsCount: number;
  lowStockItemsCount: number;
  outOfStockCount: number;
  unresolvedDiscrepanciesCount: number;
  unresolvedDiscrepancyValue: number;
  weeklySpend: number;
  weeklyBudget: number;
  monthlyWastageValue: number;
  avgProfitMarginPercent: number;
}
