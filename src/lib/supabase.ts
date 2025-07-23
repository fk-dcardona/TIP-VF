import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface InventoryRecord {
  id?: number
  product_code: string
  product_detail: string
  product_group: string
  product_subgroup?: string
  period: string
  previous_stock: number
  stock_in: number
  stock_out: number
  current_stock: number
  average_cost: number
  last_cost: number
  unit_type: string
  created_at?: string
  updated_at?: string
}

export interface SalesRecord {
  id?: number
  product_source_code: string
  document_number: number
  movement_type: string
  document_date: string
  customer_name: string
  customer_id: number
  customer_phone: string
  customer_alt_phone: string
  source_name: string
  brand: string
  product_code: string
  product_detail: string
  product_quantity: number
  product_value: number
  gross_value: number
  tax_amount: number
  discount_amount: number
  discount_percentage: number
  net_value: number
  product_group: string
  inventory_sign: string
  territory: string
  third_party_code: string
  salesperson_name: string
  created_at?: string
  updated_at?: string
}

export interface Dataset {
  id: number
  name: string
  type: 'inventory' | 'sales'
  filename: string
  record_count: number
  uploaded_at: string
  period?: string
} 