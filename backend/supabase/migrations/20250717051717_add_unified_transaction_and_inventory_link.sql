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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_unified_transactions_org_id" ON "public"."unified_transactions" ("org_id");
CREATE INDEX IF NOT EXISTS "idx_unified_transactions_sku" ON "public"."unified_transactions" ("sku");
CREATE INDEX IF NOT EXISTS "idx_unified_transactions_transaction_date" ON "public"."unified_transactions" ("transaction_date");
CREATE INDEX IF NOT EXISTS "idx_unified_transactions_inventory_status" ON "public"."unified_transactions" ("inventory_status");

CREATE INDEX IF NOT EXISTS "idx_document_inventory_links_org_id" ON "public"."document_inventory_links" ("org_id");
CREATE INDEX IF NOT EXISTS "idx_document_inventory_links_sku" ON "public"."document_inventory_links" ("sku");
CREATE INDEX IF NOT EXISTS "idx_document_inventory_links_inventory_status" ON "public"."document_inventory_links" ("inventory_status");
