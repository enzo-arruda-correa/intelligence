import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface User {
  id: string
  email: string
  created_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  name: string
  avatar_url?: string
}

export interface Sale {
  id: string
  customer_id: string
  seller_id: string
  total_amount: number
  tax_amount: number
  discount_amount: number
  sale_date: string
  status: string
  created_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  product_variation_id?: string
  quantity: number
  unit_price: number
  total_price: number
  discount_amount: number
}

export interface Product {
  id: string
  name: string
  description: string
  base_price: number
  cost_price: number
  category: string
  sku: string
  created_at: string
}

export interface ProductVariation {
  id: string
  product_id: string
  name: string
  sku: string
  price: number
  cost_price: number
  stock_quantity: number
  attributes: Record<string, any>
}