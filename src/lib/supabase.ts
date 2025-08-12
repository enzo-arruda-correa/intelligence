import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

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
  role?: string
}

export interface Sale {
  id: string
  user_id: string
  total_amount: number
  created_at: string
  updated_at: string
  status: string
  cliente?: string
  client_cpf?: string
  client_name?: string
  employee_id?: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  variation_id?: string
  quantity: number
  price: number
  name: string
  created_at: string
  unit_price?: string
}

export interface Product {
  id: string
  name: string
  description?: string
  quantity: number
  min_quantity?: number
  price?: number
  user_id?: string
  created_at: string
  barcode?: string
  has_variations?: boolean
  updated_at?: string
  category_id?: string
  allocated_fixed_cust?: number
  production_time?: number
  average_loss_percentage?: number
}

export interface ProductVariation {
  id: string
  product_id: string
  name: string
  barcode: string
  sku?: string
  price: number
  quantity?: number
  attributes?: Record<string, any>
  created_at: string
  user_id?: string
  updated_at?: string
  allocated_fixed_cost?: number
  production_time?: number
  average_loss_percentage?: number
}

export interface Cliente {
  id: string
  created_at: string
  nome?: string
  telefone?: string
  endereco?: string
  data_nascimento?: string
  quantidade_compras?: string
  cpf?: string
  updated_at?: string
}

export interface Employee {
  id: string
  user_id?: string
  name: string
  code: string
  role_id?: string
  base_salary: number
  admission_date?: string
  termination_date?: string
  emergency_contact?: string
  emergency_phone?: string
  bank_info?: Record<string, any>
  cpf?: string
  created_at: string
  updated_at: string
  email?: string
  first_name?: string
  hire_date?: string
  last_name?: string
  status: string
  num_vendas: number
  is_active?: boolean
  commission_percentage: number
}