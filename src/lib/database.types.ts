export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          code: string
          description: string | null
          category: string
          unit: string
          sale_price: number
          cost_price: number
          allocated_fixed_cost: number
          production_time: number
          average_loss_percentage: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          code: string
          description?: string | null
          category: string
          unit: string
          sale_price?: number
          cost_price?: number
          allocated_fixed_cost?: number
          production_time?: number
          average_loss_percentage?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          code?: string
          description?: string | null
          category?: string
          unit?: string
          sale_price?: number
          cost_price?: number
          allocated_fixed_cost?: number
          production_time?: number
          average_loss_percentage?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      products_variations: {
        Row: {
          id: string
          product_id: string
          name: string
          code: string
          sale_price: number
          cost_price: number
          stock_quantity: number
          minimum_stock: number
          attributes: Json
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          code: string
          sale_price?: number
          cost_price?: number
          stock_quantity?: number
          minimum_stock?: number
          attributes?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          code?: string
          sale_price?: number
          cost_price?: number
          stock_quantity?: number
          minimum_stock?: number
          attributes?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      erp_suppliers: {
        Row: {
          id: string
          user_id: string
          name: string
          contact: string | null
          email: string | null
          phone: string | null
          lead_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          contact?: string | null
          email?: string | null
          phone?: string | null
          lead_time?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          contact?: string | null
          email?: string | null
          phone?: string | null
          lead_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      erp_raw_materials: {
        Row: {
          id: string
          user_id: string
          name: string
          code: string
          unit: string
          unit_cost: number
          current_stock: number
          minimum_stock: number
          waste_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          code: string
          unit: string
          unit_cost?: number
          current_stock?: number
          minimum_stock?: number
          waste_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          code?: string
          unit?: string
          unit_cost?: number
          current_stock?: number
          minimum_stock?: number
          waste_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      erp_material_suppliers: {
        Row: {
          id: string
          material_id: string
          supplier_id: string
          created_at: string
        }
        Insert: {
          id?: string
          material_id: string
          supplier_id: string
          created_at?: string
        }
        Update: {
          id?: string
          material_id?: string
          supplier_id?: string
          created_at?: string
        }
      }
      erp_products: {
        Row: {
          id: string
          user_id: string
          name: string
          code: string
          unit: string
          category: string
          sale_price: number
          allocated_fixed_cost: number
          production_time: number
          average_loss_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          code: string
          unit: string
          category: string
          sale_price?: number
          allocated_fixed_cost?: number
          production_time?: number
          average_loss_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          code?: string
          unit?: string
          category?: string
          sale_price?: number
          allocated_fixed_cost?: number
          production_time?: number
          average_loss_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      erp_bom: {
        Row: {
          id: string
          product_id: string
          total_production_time: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          total_production_time?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          total_production_time?: number
          created_at?: string
          updated_at?: string
        }
      }
      erp_bom_items: {
        Row: {
          id: string
          bom_id: string
          raw_material_id: string
          quantity: number
          unit: string
          waste_adjusted_quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          bom_id: string
          raw_material_id: string
          quantity: number
          unit: string
          waste_adjusted_quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          bom_id?: string
          raw_material_id?: string
          quantity?: number
          unit?: string
          waste_adjusted_quantity?: number
          created_at?: string
        }
      }
      erp_production_steps: {
        Row: {
          id: string
          bom_id: string
          name: string
          description: string | null
          time_minutes: number
          labor_cost_per_hour: number
          indirect_costs: number
          average_loss: number
          step_order: number
          created_at: string
        }
        Insert: {
          id?: string
          bom_id: string
          name: string
          description?: string | null
          time_minutes?: number
          labor_cost_per_hour?: number
          indirect_costs?: number
          average_loss?: number
          step_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          bom_id?: string
          name?: string
          description?: string | null
          time_minutes?: number
          labor_cost_per_hour?: number
          indirect_costs?: number
          average_loss?: number
          step_order?: number
          created_at?: string
        }
      }
      erp_production_orders: {
        Row: {
          id: string
          user_id: string
          product_id: string
          quantity: number
          status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          planned_date: string
          completed_date: string | null
          actual_cost: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          quantity: number
          status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          planned_date: string
          completed_date?: string | null
          actual_cost?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          quantity?: number
          status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
          planned_date?: string
          completed_date?: string | null
          actual_cost?: number | null
          created_at?: string
        }
      }
      erp_stock_movements: {
        Row: {
          id: string
          user_id: string
          raw_material_id: string
          type: 'IN' | 'OUT' | 'ADJUSTMENT'
          quantity: number
          reason: string
          production_order_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          raw_material_id: string
          type: 'IN' | 'OUT' | 'ADJUSTMENT'
          quantity: number
          reason: string
          production_order_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          raw_material_id?: string
          type?: 'IN' | 'OUT' | 'ADJUSTMENT'
          quantity?: number
          reason?: string
          production_order_id?: string | null
          created_at?: string
        }
      }
      erp_cost_calculations: {
        Row: {
          id: string
          product_id: string
          raw_materials_cost: number
          labor_cost: number
          indirect_costs: number
          loss_cost: number
          total_production_cost: number
          fixed_cost_allocation: number
          total_unit_cost: number
          profit_margin: number
          profit_margin_percentage: number
          break_even_point: number
          contribution_margin: number
          calculated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          raw_materials_cost?: number
          labor_cost?: number
          indirect_costs?: number
          loss_cost?: number
          total_production_cost?: number
          fixed_cost_allocation?: number
          total_unit_cost?: number
          profit_margin?: number
          profit_margin_percentage?: number
          break_even_point?: number
          contribution_margin?: number
          calculated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          raw_materials_cost?: number
          labor_cost?: number
          indirect_costs?: number
          loss_cost?: number
          total_production_cost?: number
          fixed_cost_allocation?: number
          total_unit_cost?: number
          profit_margin?: number
          profit_margin_percentage?: number
          break_even_point?: number
          contribution_margin?: number
          calculated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_product_costs: {
        Args: {
          product_uuid: string
        }
        Returns: {
          raw_materials_cost: number
          labor_cost: number
          indirect_costs: number
          loss_cost: number
          total_production_cost: number
          total_unit_cost: number
          profit_margin: number
          profit_margin_percentage: number
          contribution_margin: number
          break_even_point: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}