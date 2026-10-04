-- Belmarose Stock & Inventory Management - Complete PostgreSQL / Supabase Schema
-- Architecture: Single location v1, scalable to multi-location

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE stock_take_type AS ENUM ('daily_opening', 'daily_closing', 'weekly_audit', 'spot_check');
CREATE TYPE stock_take_status AS ENUM ('in_progress', 'completed', 'cancelled');
CREATE TYPE po_status AS ENUM ('draft', 'submitted', 'partially_received', 'received', 'cancelled');
CREATE TYPE wastage_reason AS ENUM ('spoilage', 'spillage', 'breakage', 'complimentary', 'bartender_error', 'expired', 'other');
CREATE TYPE movement_type AS ENUM ('purchase_receive', 'sales_deduction', 'wastage', 'audit_adjustment', 'initial_setup');
CREATE TYPE discrepancy_status AS ENUM ('pending_review', 'investigating', 'resolved', 'written_off');

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color_tag VARCHAR(30) DEFAULT '#1A6EFC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. VENDORS / SUPPLIERS
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    gstin VARCHAR(50),
    payment_terms VARCHAR(100) DEFAULT 'Net 15 Days',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PRODUCTS (LIQUOR & BEVERAGES)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    uom VARCHAR(50) NOT NULL DEFAULT 'BTL.', -- BTL., CAN, KEG, CASE, ML
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    opening_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reorder_point NUMERIC(12, 2) NOT NULL DEFAULT 5.00,
    ideal_stock NUMERIC(12, 2) NOT NULL DEFAULT 20.00,
    min_order_qty NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    case_size INTEGER DEFAULT 1, -- e.g. 24 cans/bottles per case for beer
    last_2week_sales NUMERIC(12, 2) DEFAULT 0.00,
    barcode VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. STOCK TAKE SESSIONS (Daily Opening/Closing, Audits)
CREATE TABLE IF NOT EXISTS stock_take_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_code VARCHAR(50) NOT NULL UNIQUE,
    type stock_take_type NOT NULL DEFAULT 'daily_closing',
    status stock_take_status NOT NULL DEFAULT 'in_progress',
    conducted_by VARCHAR(150) NOT NULL,
    notes TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 7. STOCK TAKE ITEMS (Physical Count vs Expected Stock)
CREATE TABLE IF NOT EXISTS stock_take_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES stock_take_sessions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    system_stock NUMERIC(12, 2) NOT NULL,
    counted_stock NUMERIC(12, 2) NOT NULL,
    variance NUMERIC(12, 2) GENERATED ALWAYS AS (counted_stock - system_stock) STORED,
    variance_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. DISCREPANCIES AUDIT LOG
CREATE TABLE IF NOT EXISTS discrepancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    stock_take_session_id UUID REFERENCES stock_take_sessions(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_qty NUMERIC(12, 2) NOT NULL,
    actual_qty NUMERIC(12, 2) NOT NULL,
    variance NUMERIC(12, 2) NOT NULL,
    variance_value NUMERIC(12, 2) NOT NULL,
    status discrepancy_status NOT NULL DEFAULT 'pending_review',
    resolution_notes TEXT,
    reviewed_by VARCHAR(150),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. WASTAGE & SPOILAGE LOGS
CREATE TABLE IF NOT EXISTS wastage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    reason wastage_reason NOT NULL DEFAULT 'spoilage',
    cost_impact NUMERIC(12, 2) NOT NULL,
    logged_by VARCHAR(150) NOT NULL,
    notes TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(50) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    status po_status NOT NULL DEFAULT 'draft',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    budget_limit NUMERIC(12, 2) DEFAULT NULL,
    budget_exceeded BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    ordered_by VARCHAR(150) NOT NULL,
    expected_date DATE,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. PURCHASE ORDER ITEMS
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    ordered_qty NUMERIC(12, 2) NOT NULL CHECK (ordered_qty > 0),
    received_qty NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(12, 2) NOT NULL,
    total_cost NUMERIC(12, 2) GENERATED ALWAYS AS (ordered_qty * unit_cost) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. WEEKLY ORDERING PLANS (Belmarose Excel Workflow in DB)
CREATE TABLE IF NOT EXISTS weekly_order_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_title VARCHAR(150) NOT NULL, -- e.g. "Ordering 3rd week July", "Ordering 4th week July"
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    budget_limit NUMERIC(12, 2) DEFAULT 150000.00,
    total_requisition_value NUMERIC(12, 2) DEFAULT 0.00,
    total_suggested_value NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, finalized, converted_to_pos
    created_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_order_plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES weekly_order_plans(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    stock_in_hand NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    last_2week_sales NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    suggested_qty NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    requisition_qty NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    projected_stock_after NUMERIC(12, 2) GENERATED ALWAYS AS (stock_in_hand + requisition_qty) STORED,
    total_cost NUMERIC(12, 2) GENERATED ALWAYS AS (requisition_qty * unit_cost) STORED,
    notes TEXT
);

-- 13. AUDITABLE STOCK MOVEMENTS (Ledger)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type movement_type NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL, -- positive for additions, negative for deductions
    previous_stock NUMERIC(12, 2) NOT NULL,
    new_stock NUMERIC(12, 2) NOT NULL,
    reference_id UUID, -- links to po_id, stock_take_id, or wastage_id
    reference_type VARCHAR(50),
    notes TEXT,
    created_by VARCHAR(150) DEFAULT 'System',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(current_stock);
CREATE INDEX IF NOT EXISTS idx_stock_take_items_session ON stock_take_items(session_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_product ON discrepancies(product_id);
CREATE INDEX IF NOT EXISTS idx_discrepancies_status ON discrepancies(status);
CREATE INDEX IF NOT EXISTS idx_wastage_product ON wastage_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);

-- 15. AUTOMATIC TRIGGER FOR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON purchase_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_order_plans_updated_at
BEFORE UPDATE ON weekly_order_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
