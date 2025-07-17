-- Create organizations table (required for multi-tenancy)
CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" character varying(100) NOT NULL,
    "name" character varying(255) NOT NULL,
    "domain" character varying(255),
    "created_date" timestamp with time zone DEFAULT now(),
    "updated_date" timestamp with time zone DEFAULT now(),
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- Create uploads table
CREATE TABLE IF NOT EXISTS "public"."uploads" (
    "id" SERIAL PRIMARY KEY,
    "filename" character varying(255) NOT NULL,
    "original_filename" character varying(255) NOT NULL,
    "file_size" integer NOT NULL,
    "file_type" character varying(50) NOT NULL,
    "upload_date" timestamp with time zone DEFAULT now(),
    "user_id" character varying(100) NOT NULL,
    "org_id" character varying(100) NOT NULL,
    "status" character varying(50) DEFAULT 'uploaded'::character varying,
    "row_count" integer DEFAULT 0,
    "column_count" integer DEFAULT 0,
    "data_summary" text,
    "error_message" text
);

-- Create trade_documents table
CREATE TABLE IF NOT EXISTS "public"."trade_documents" (
    "id" character varying(36) NOT NULL,
    "org_id" character varying(100) NOT NULL,
    "document_type" character varying(50) NOT NULL,
    "document_number" character varying(100),
    "upload_id" integer,
    "extracted_data" jsonb,
    "extraction_confidence" double precision,
    "document_date" date,
    "processed_at" timestamp with time zone,
    "status" character varying(50),
    "validation_errors" jsonb,
    CONSTRAINT "trade_documents_pkey" PRIMARY KEY ("id")
);

-- Create UnifiedTransaction table
CREATE TABLE IF NOT EXISTS "public"."unified_transactions" (
    "transaction_id" character varying(50) NOT NULL,
    "org_id" character varying(100) NOT NULL,
    "transaction_type" character varying(20),
    "source_document_id" character varying(36),
    "document_confidence" double precision,
    "sku" character varying(100),
    "product_description" character varying(500),
    "product_category" character varying(100),
    "product_subcategory" character varying(100),
    "brand" character varying(100),
    "unit_cost" double precision,
    "total_cost" double precision,
    "actual_cost" double precision,
    "planned_cost" double precision,
    "cost_variance" double precision,
    "cost_variance_percentage" double precision,
    "quantity" double precision,
    "committed_quantity" double precision,
    "received_quantity" double precision,
    "available_stock" double precision,
    "in_transit_stock" double precision,
    "inventory_status" character varying(50),
    "transaction_date" date,
    "po_date" date,
    "ship_date" date,
    "eta_date" date,
    "received_date" date,
    "compliance_status" character varying(50),
    "risk_score" double precision,
    "anomaly_flags" jsonb,
    "supplier_name" character varying(255),
    "supplier_id" character varying(100),
    "customer_name" character varying(255),
    "customer_id" character varying(100),
    "city" character varying(100),
    "country" character varying(100),
    "region" character varying(100),
    "warehouse_code" character varying(50),
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "upload_id" integer,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "unified_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- Create DocumentInventoryLink table
CREATE TABLE IF NOT EXISTS "public"."document_inventory_links" (
    "id" character varying(36) NOT NULL,
    "org_id" character varying(100) NOT NULL,
    "po_document_id" character varying(36),
    "invoice_document_id" character varying(36),
    "bol_document_id" character varying(36),
    "sku" character varying(100) NOT NULL,
    "product_description" character varying(500),
    "po_quantity" double precision,
    "shipped_quantity" double precision,
    "received_quantity" double precision,
    "available_inventory" double precision,
    "po_unit_cost" double precision,
    "invoice_unit_cost" double precision,
    "landed_cost" double precision,
    "inventory_status" character varying(50) DEFAULT 'normal'::character varying,
    "compromise_reasons" jsonb,
    "po_date" date,
    "ship_date" date,
    "eta_date" date,
    "received_date" date,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "document_inventory_links_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "public"."uploads" ADD CONSTRAINT "uploads_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;
ALTER TABLE "public"."trade_documents" ADD CONSTRAINT "trade_documents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;
ALTER TABLE "public"."trade_documents" ADD CONSTRAINT "trade_documents_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE SET NULL;

ALTER TABLE "public"."unified_transactions" ADD CONSTRAINT "unified_transactions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;
ALTER TABLE "public"."unified_transactions" ADD CONSTRAINT "unified_transactions_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "public"."trade_documents"("id") ON DELETE SET NULL;
ALTER TABLE "public"."unified_transactions" ADD CONSTRAINT "unified_transactions_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE SET NULL;

ALTER TABLE "public"."document_inventory_links" ADD CONSTRAINT "document_inventory_links_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;
ALTER TABLE "public"."document_inventory_links" ADD CONSTRAINT "document_inventory_links_po_document_id_fkey" FOREIGN KEY ("po_document_id") REFERENCES "public"."trade_documents"("id") ON DELETE SET NULL;
ALTER TABLE "public"."document_inventory_links" ADD CONSTRAINT "document_inventory_links_invoice_document_id_fkey" FOREIGN KEY ("invoice_document_id") REFERENCES "public"."trade_documents"("id") ON DELETE SET NULL;
ALTER TABLE "public"."document_inventory_links" ADD CONSTRAINT "document_inventory_links_bol_document_id_fkey" FOREIGN KEY ("bol_document_id") REFERENCES "public"."trade_documents"("id") ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_uploads_org_id" ON "public"."uploads" ("org_id");
CREATE INDEX IF NOT EXISTS "idx_uploads_user_id" ON "public"."uploads" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_uploads_status" ON "public"."uploads" ("status");

CREATE INDEX IF NOT EXISTS "idx_trade_documents_org_id" ON "public"."trade_documents" ("org_id");
CREATE INDEX IF NOT EXISTS "idx_trade_documents_document_type" ON "public"."trade_documents" ("document_type");
CREATE INDEX IF NOT EXISTS "idx_trade_documents_upload_id" ON "public"."trade_documents" ("upload_id");

CREATE INDEX IF NOT EXISTS "idx_unified_transactions_org_id" ON "public"."unified_transactions" ("org_id");
CREATE INDEX IF NOT EXISTS "idx_unified_transactions_sku" ON "public"."unified_transactions" ("sku");
CREATE INDEX IF NOT EXISTS "idx_unified_transactions_transaction_date" ON "public"."unified_transactions" ("transaction_date");
CREATE INDEX IF NOT EXISTS "idx_unified_transactions_inventory_status" ON "public"."unified_transactions" ("inventory_status");

CREATE INDEX IF NOT EXISTS "idx_document_inventory_links_org_id" ON "public"."document_inventory_links" ("org_id");
CREATE INDEX IF NOT EXISTS "idx_document_inventory_links_sku" ON "public"."document_inventory_links" ("sku");
CREATE INDEX IF NOT EXISTS "idx_document_inventory_links_inventory_status" ON "public"."document_inventory_links" ("inventory_status");

-- Add RLS (Row Level Security) policies
ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."uploads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."trade_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."unified_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."document_inventory_links" ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to access their organization's data
CREATE POLICY "Users can view their organization" ON "public"."organizations"
    FOR SELECT USING (auth.jwt() ->> 'org_id' = id);

CREATE POLICY "Users can view their organization's uploads" ON "public"."uploads"
    FOR SELECT USING (auth.jwt() ->> 'org_id' = org_id);

CREATE POLICY "Users can insert their organization's uploads" ON "public"."uploads"
    FOR INSERT WITH CHECK (auth.jwt() ->> 'org_id' = org_id);

CREATE POLICY "Users can view their organization's trade documents" ON "public"."trade_documents"
    FOR SELECT USING (auth.jwt() ->> 'org_id' = org_id);

CREATE POLICY "Users can insert their organization's trade documents" ON "public"."trade_documents"
    FOR INSERT WITH CHECK (auth.jwt() ->> 'org_id' = org_id);

CREATE POLICY "Users can view their organization's unified transactions" ON "public"."unified_transactions"
    FOR SELECT USING (auth.jwt() ->> 'org_id' = org_id);

CREATE POLICY "Users can insert their organization's unified transactions" ON "public"."unified_transactions"
    FOR INSERT WITH CHECK (auth.jwt() ->> 'org_id' = org_id);

CREATE POLICY "Users can update their organization's unified transactions" ON "public"."unified_transactions"
    FOR UPDATE USING (auth.jwt() ->> 'org_id' = org_id);

CREATE POLICY "Users can view their organization's document inventory links" ON "public"."document_inventory_links"
    FOR SELECT USING (auth.jwt() ->> 'org_id' = org_id);

CREATE POLICY "Users can insert their organization's document inventory links" ON "public"."document_inventory_links"
    FOR INSERT WITH CHECK (auth.jwt() ->> 'org_id' = org_id);

CREATE POLICY "Users can update their organization's document inventory links" ON "public"."document_inventory_links"
    FOR UPDATE USING (auth.jwt() ->> 'org_id' = org_id);
