-- 🚀 TIP Platform Complete Database Schema
-- SuperClaude Optimized for Colombian Market
-- Target: Production deployment by Tuesday

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Create schema
CREATE SCHEMA IF NOT EXISTS tip;

-- Set search path
SET search_path TO tip, public;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Companies table with Colombian business specifics
CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  nit VARCHAR(20) UNIQUE, -- Colombian tax ID
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  country CHAR(2) DEFAULT 'CO' CHECK (country IN ('CO', 'MX', 'EC', 'PE')),
  city VARCHAR(100),
  address TEXT,
  
  -- Settings as JSONB for flexibility
  settings JSONB DEFAULT '{
    "currency": "COP",
    "language": "es",
    "timezone": "America/Bogota",
    "notifications": {
      "email": true,
      "whatsapp": false,
      "sms": false
    },
    "features": {
      "ai_processing": true,
      "auto_alerts": true,
      "advanced_analytics": false
    },
    "business": {
      "import_frequency": "weekly",
      "primary_origins": ["CN", "US"],
      "avg_shipment_value": 0
    }
  }'::jsonb,
  
  -- Subscription and limits
  plan VARCHAR(20) DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'enterprise')),
  monthly_operations_limit INTEGER DEFAULT 50,
  storage_limit_gb INTEGER DEFAULT 10,
  
  -- Metadata
  onboarded_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT valid_nit CHECK (nit ~ '^[0-9]{9}-[0-9]$' OR nit IS NULL)
);

-- Users table with role-based access
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
  
  -- Authentication
  auth_id UUID UNIQUE, -- Supabase auth.users reference
  last_login_at TIMESTAMPTZ,
  
  -- Preferences
  preferences JSONB DEFAULT '{
    "notifications": {
      "email_daily_summary": true,
      "email_alerts": true,
      "whatsapp_alerts": false
    },
    "dashboard": {
      "default_view": "operations",
      "date_range": "last_30_days"
    }
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import operations main table
CREATE TABLE import_operations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reference_number VARCHAR(50) NOT NULL,
  po_number VARCHAR(50),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft', 'confirmed', 'in_production', 'in_transit', 
    'in_customs', 'cleared', 'delivered', 'completed', 'cancelled'
  )),
  sub_status VARCHAR(50), -- More detailed status
  
  -- Supplier information
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name VARCHAR(255) NOT NULL, -- Denormalized for performance
  supplier_country CHAR(2) NOT NULL,
  
  -- Dates
  order_date DATE,
  production_date DATE,
  shipped_date DATE,
  eta_port DATE,
  eta_destination DATE,
  delivered_date DATE,
  
  -- Shipping details
  origin_port VARCHAR(100),
  destination_port VARCHAR(100),
  shipping_method VARCHAR(20) CHECK (shipping_method IN ('sea', 'air', 'land', 'multimodal')),
  container_number VARCHAR(20),
  bl_number VARCHAR(50),
  
  -- Financial summary (denormalized for performance)
  total_fob_usd DECIMAL(12, 2),
  total_freight_usd DECIMAL(12, 2),
  total_insurance_usd DECIMAL(12, 2),
  total_costs_usd DECIMAL(12, 2),
  import_factor DECIMAL(5, 3),
  exchange_rate DECIMAL(10, 4), -- USD to COP
  
  -- Metadata
  notes TEXT,
  tags TEXT[], -- For flexible categorization
  custom_fields JSONB DEFAULT '{}',
  
  -- Timeline tracking
  timeline JSONB DEFAULT '[]', -- Array of timeline events
  
  -- Performance metrics
  processing_time_days INTEGER,
  delays_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_company_reference UNIQUE(company_id, reference_number)
);

-- Suppliers table
CREATE TABLE suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  country CHAR(2) NOT NULL,
  city VARCHAR(100),
  address TEXT,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Business information
  payment_terms VARCHAR(50),
  currency VARCHAR(3) DEFAULT 'USD',
  average_lead_time_days INTEGER,
  minimum_order_value DECIMAL(12, 2),
  
  -- Performance metrics
  reliability_score DECIMAL(3, 2), -- 0.00 to 1.00
  quality_score DECIMAL(3, 2),
  on_time_score DECIMAL(3, 2),
  total_orders INTEGER DEFAULT 0,
  
  -- Compliance
  certifications TEXT[],
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_company_supplier UNIQUE(company_id, name, country)
);

-- Products/items in import operations
CREATE TABLE operation_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  operation_id UUID NOT NULL REFERENCES import_operations(id) ON DELETE CASCADE,
  
  -- Product identification
  product_code VARCHAR(50),
  description TEXT NOT NULL,
  hs_code VARCHAR(10), -- Harmonized System code
  
  -- Quantities and units
  quantity DECIMAL(12, 3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  packages INTEGER,
  package_type VARCHAR(50),
  
  -- Costs
  unit_price_usd DECIMAL(12, 4),
  total_price_usd DECIMAL(12, 2),
  
  -- Weight and dimensions
  net_weight_kg DECIMAL(12, 3),
  gross_weight_kg DECIMAL(12, 3),
  volume_cbm DECIMAL(12, 3),
  
  -- Colombian customs
  tariff_rate DECIMAL(5, 2), -- Percentage
  tariff_amount_cop DECIMAL(12, 2),
  iva_amount_cop DECIMAL(12, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table with AI processing tracking
CREATE TABLE documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  operation_id UUID NOT NULL REFERENCES import_operations(id) ON DELETE CASCADE,
  
  -- Document metadata
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'commercial_invoice', 'packing_list', 'bill_of_lading', 
    'certificate_of_origin', 'inspection_certificate', 'customs_declaration',
    'payment_proof', 'insurance_policy', 'other'
  )),
  name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  
  -- AI processing
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN (
    'pending', 'processing', 'completed', 'failed', 'manual_review'
  )),
  processed_at TIMESTAMPTZ,
  processing_time_ms INTEGER,
  
  -- Extracted data
  extracted_data JSONB DEFAULT '{}',
  confidence_scores JSONB DEFAULT '{}', -- Field-level confidence
  
  -- Validation
  validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN (
    'pending', 'valid', 'invalid', 'warnings'
  )),
  validation_errors JSONB DEFAULT '[]',
  validation_warnings JSONB DEFAULT '[]',
  
  -- Manual review
  requires_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Version control
  version INTEGER DEFAULT 1,
  is_latest BOOLEAN DEFAULT true,
  replaced_by UUID REFERENCES documents(id),
  
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Costs breakdown table
CREATE TABLE operation_costs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  operation_id UUID NOT NULL REFERENCES import_operations(id) ON DELETE CASCADE,
  
  -- Cost categorization
  category VARCHAR(30) NOT NULL CHECK (category IN (
    'product', 'freight_international', 'freight_local', 'insurance',
    'customs_duties', 'customs_fees', 'agent_fees', 'storage', 
    'inspection', 'documentation', 'banking', 'other'
  )),
  subcategory VARCHAR(50),
  description TEXT,
  
  -- Amount and currency
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  exchange_rate DECIMAL(10, 4),
  amount_cop DECIMAL(12, 2), -- Converted to COP
  
  -- References
  invoice_number VARCHAR(50),
  document_id UUID REFERENCES documents(id),
  supplier_id UUID REFERENCES suppliers(id),
  
  -- Payment tracking
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'scheduled', 'processing', 'paid', 'overdue'
  )),
  due_date DATE,
  paid_date DATE,
  payment_reference VARCHAR(100),
  
  -- Allocation
  allocated_to_items BOOLEAN DEFAULT false,
  allocation_method VARCHAR(20), -- weight, value, volume, equal
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts and notifications
CREATE TABLE alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  operation_id UUID REFERENCES import_operations(id) ON DELETE CASCADE,
  
  -- Alert details
  type VARCHAR(30) NOT NULL CHECK (type IN (
    'document_missing', 'document_invalid', 'cost_threshold', 
    'delivery_delay', 'payment_due', 'customs_hold', 
    'inventory_low', 'price_change', 'compliance_issue'
  )),
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Action required
  action_required BOOLEAN DEFAULT false,
  action_url TEXT,
  action_deadline TIMESTAMPTZ,
  
  -- Delivery status
  channels JSONB DEFAULT '["in_app"]', -- ["in_app", "email", "whatsapp", "sms"]
  delivery_status JSONB DEFAULT '{}', -- Channel-specific status
  
  -- User interaction
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  snoozed_until TIMESTAMPTZ,
  
  -- Resolution
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log for audit trail
CREATE TABLE activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- Activity details
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(30) NOT NULL,
  entity_id UUID,
  
  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Companies
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_created_at ON companies(created_at DESC);
CREATE INDEX idx_companies_nit ON companies(nit) WHERE nit IS NOT NULL;

-- Users
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_role ON users(company_id, role);

-- Import Operations
CREATE INDEX idx_operations_company_status ON import_operations(company_id, status);
CREATE INDEX idx_operations_dates ON import_operations(company_id, created_at DESC);
CREATE INDEX idx_operations_eta ON import_operations(eta_destination) WHERE status NOT IN ('completed', 'cancelled');
CREATE INDEX idx_operations_reference ON import_operations(reference_number);
CREATE INDEX idx_operations_supplier ON import_operations(supplier_id);

-- Documents
CREATE INDEX idx_documents_operation ON documents(operation_id);
CREATE INDEX idx_documents_type_status ON documents(operation_id, type, validation_status);
CREATE INDEX idx_documents_processing ON documents(processing_status) WHERE processing_status != 'completed';

-- Costs
CREATE INDEX idx_costs_operation ON operation_costs(operation_id);
CREATE INDEX idx_costs_payment ON operation_costs(payment_status, due_date) WHERE payment_status != 'paid';

-- Alerts
CREATE INDEX idx_alerts_company_unread ON alerts(company_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX idx_alerts_operation ON alerts(operation_id) WHERE operation_id IS NOT NULL;
CREATE INDEX idx_alerts_action ON alerts(company_id, action_deadline) WHERE action_required = true AND resolved = false;

-- Activity Logs
CREATE INDEX idx_activity_logs_company ON activity_logs(company_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Companies: Users can only see their own company
CREATE POLICY "Users can view own company" ON companies
  FOR ALL USING (id IN (
    SELECT company_id FROM users WHERE auth_id = auth.uid()
  ));

-- Users: Can see users in same company
CREATE POLICY "Users can view company users" ON users
  FOR SELECT USING (company_id IN (
    SELECT company_id FROM users WHERE auth_id = auth.uid()
  ));

-- Import Operations: Company-scoped access
CREATE POLICY "Company operations access" ON import_operations
  FOR ALL USING (company_id IN (
    SELECT company_id FROM users WHERE auth_id = auth.uid()
  ));

-- Similar policies for other tables...

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON import_operations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ... (apply to all tables)

-- Calculate import factor on cost update
CREATE OR REPLACE FUNCTION calculate_import_factor()
RETURNS TRIGGER AS $$
DECLARE
  v_total_fob DECIMAL;
  v_total_costs DECIMAL;
  v_import_factor DECIMAL;
BEGIN
  -- Calculate totals
  SELECT 
    COALESCE(SUM(CASE WHEN category = 'product' THEN amount_cop ELSE 0 END), 0),
    COALESCE(SUM(amount_cop), 0)
  INTO v_total_fob, v_total_costs
  FROM operation_costs
  WHERE operation_id = NEW.operation_id;
  
  -- Calculate import factor
  IF v_total_fob > 0 THEN
    v_import_factor := v_total_costs / v_total_fob;
  ELSE
    v_import_factor := 1;
  END IF;
  
  -- Update operation
  UPDATE import_operations
  SET 
    total_costs_usd = v_total_costs / COALESCE(exchange_rate, 4000),
    import_factor = v_import_factor
  WHERE id = NEW.operation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_import_factor AFTER INSERT OR UPDATE OR DELETE ON operation_costs
  FOR EACH ROW EXECUTE FUNCTION calculate_import_factor();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Colombian holidays for 2024
CREATE TABLE holidays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  country CHAR(2) NOT NULL,
  date DATE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'national',
  UNIQUE(country, date)
);

INSERT INTO holidays (country, date, name) VALUES
  ('CO', '2024-01-01', 'Año Nuevo'),
  ('CO', '2024-01-08', 'Día de los Reyes Magos'),
  ('CO', '2024-03-25', 'Día de San José'),
  ('CO', '2024-03-28', 'Jueves Santo'),
  ('CO', '2024-03-29', 'Viernes Santo'),
  ('CO', '2024-05-01', 'Día del Trabajo'),
  ('CO', '2024-05-13', 'Día de la Ascensión'),
  ('CO', '2024-06-03', 'Corpus Christi'),
  ('CO', '2024-06-10', 'Sagrado Corazón'),
  ('CO', '2024-07-01', 'San Pedro y San Pablo'),
  ('CO', '2024-07-20', 'Día de la Independencia'),
  ('CO', '2024-08-07', 'Batalla de Boyacá'),
  ('CO', '2024-08-19', 'La Asunción de la Virgen'),
  ('CO', '2024-10-14', 'Día de la Raza'),
  ('CO', '2024-11-04', 'Todos los Santos'),
  ('CO', '2024-11-11', 'Independencia de Cartagena'),
  ('CO', '2024-12-08', 'Día de la Inmaculada Concepción'),
  ('CO', '2024-12-25', 'Navidad');

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- Active operations dashboard view
CREATE VIEW v_active_operations AS
SELECT 
  io.*,
  c.name as company_name,
  s.name as supplier_name,
  COUNT(DISTINCT d.id) as document_count,
  COUNT(DISTINCT d.id) FILTER (WHERE d.validation_status = 'valid') as valid_documents,
  COUNT(DISTINCT a.id) FILTER (WHERE a.resolved = false) as pending_alerts,
  MAX(oc.due_date) FILTER (WHERE oc.payment_status = 'pending') as next_payment_due
FROM import_operations io
JOIN companies c ON io.company_id = c.id
LEFT JOIN suppliers s ON io.supplier_id = s.id
LEFT JOIN documents d ON io.id = d.operation_id
LEFT JOIN alerts a ON io.id = a.operation_id
LEFT JOIN operation_costs oc ON io.id = oc.operation_id
WHERE io.status NOT IN ('completed', 'cancelled')
GROUP BY io.id, c.name, s.name;

-- Company metrics view
CREATE VIEW v_company_metrics AS
SELECT 
  c.id,
  c.name,
  COUNT(DISTINCT io.id) as total_operations,
  COUNT(DISTINCT io.id) FILTER (WHERE io.status NOT IN ('completed', 'cancelled')) as active_operations,
  AVG(io.import_factor) as avg_import_factor,
  SUM(io.total_costs_usd) as total_import_value_usd,
  COUNT(DISTINCT io.supplier_id) as supplier_count,
  MAX(io.created_at) as last_operation_date
FROM companies c
LEFT JOIN import_operations io ON c.id = io.company_id
GROUP BY c.id, c.name;

-- Document processing metrics
CREATE VIEW v_document_metrics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_documents,
  COUNT(*) FILTER (WHERE processing_status = 'completed') as processed,
  COUNT(*) FILTER (WHERE processing_status = 'failed') as failed,
  AVG(processing_time_ms) FILTER (WHERE processing_status = 'completed') as avg_processing_time_ms,
  COUNT(DISTINCT operation_id) as operations_with_documents
FROM documents
GROUP BY DATE(created_at);

-- =====================================================
-- PERMISSIONS GRANTS (for application user)
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA tip TO authenticated;

-- Grant all necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA tip TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA tip TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA tip TO authenticated;

-- Public read access to holidays
GRANT SELECT ON holidays TO anon;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE companies IS 'Core company/tenant information with Colombian business specifics';
COMMENT ON TABLE import_operations IS 'Main import operation tracking with comprehensive status and financial data';
COMMENT ON TABLE documents IS 'Document storage with AI processing tracking and validation';
COMMENT ON TABLE operation_costs IS 'Detailed cost breakdown for import factor calculation';
COMMENT ON TABLE alerts IS 'Multi-channel alert system for proactive notifications';

COMMENT ON COLUMN companies.nit IS 'Colombian tax identification number (NIT) in format 999999999-9';
COMMENT ON COLUMN import_operations.import_factor IS 'Total landed cost divided by FOB value';
COMMENT ON COLUMN documents.extracted_data IS 'AI-extracted structured data from document';
COMMENT ON COLUMN operation_costs.amount_cop IS 'Amount converted to Colombian Pesos at specified exchange rate';