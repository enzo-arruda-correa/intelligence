import { supabase } from '../lib/supabase'
import { Database } from '../lib/database.types'

type Tables = Database['public']['Tables']

export class SupabaseService {
  // Suppliers
  static async getSuppliers() {
    const { data, error } = await supabase
      .from('erp_suppliers')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  }

  static async createSupplier(supplier: Tables['erp_suppliers']['Insert']) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('erp_suppliers')
      .insert({ ...supplier, user_id: user.id })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateSupplier(id: string, supplier: Tables['erp_suppliers']['Update']) {
    const { data, error } = await supabase
      .from('erp_suppliers')
      .update(supplier)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteSupplier(id: string) {
    const { error } = await supabase
      .from('erp_suppliers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Raw Materials
  static async getRawMaterials() {
    const { data, error } = await supabase
      .from('erp_raw_materials')
      .select(`
        *,
        material_suppliers:erp_material_suppliers(
          supplier:erp_suppliers(*)
        )
      `)
      .order('name')
    
    if (error) throw error
    
    // Transform the data to match expected structure
    return data.map(material => ({
      ...material,
      suppliers: material.material_suppliers?.map(ms => ms.supplier) || []
    }))
  }

  static async createRawMaterial(material: Tables['erp_raw_materials']['Insert'], supplierIds: string[] = []) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('erp_raw_materials')
      .insert({ ...material, user_id: user.id })
      .select()
      .single()
    
    if (error) throw error

    // Associate with suppliers
    if (supplierIds.length > 0) {
      const supplierAssociations = supplierIds.map(supplierId => ({
        material_id: data.id,
        supplier_id: supplierId
      }))

      const { error: supplierError } = await supabase
        .from('erp_material_suppliers')
        .insert(supplierAssociations)
      
      if (supplierError) throw supplierError
    }

    return data
  }

  static async updateRawMaterial(id: string, material: Tables['erp_raw_materials']['Update'], supplierIds?: string[]) {
    const { data, error } = await supabase
      .from('erp_raw_materials')
      .update(material)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error

    // Update supplier associations if provided
    if (supplierIds !== undefined) {
      // Remove existing associations
      await supabase
        .from('erp_material_suppliers')
        .delete()
        .eq('material_id', id)

      // Add new associations
      if (supplierIds.length > 0) {
        const supplierAssociations = supplierIds.map(supplierId => ({
          material_id: id,
          supplier_id: supplierId
        }))

        const { error: supplierError } = await supabase
          .from('erp_material_suppliers')
          .insert(supplierAssociations)
        
        if (supplierError) throw supplierError
      }
    }

    return data
  }

  static async deleteRawMaterial(id: string) {
    const { error } = await supabase
      .from('erp_raw_materials')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Products
  static async getProducts() {
    const { data, error } = await supabase
      .from('erp_products')
      .select(`
        *,
        bom:erp_bom(
          *,
          items:erp_bom_items(
            *,
            raw_material:erp_raw_materials(*)
          ),
          production_steps:erp_production_steps(*)
        ),
        cost_calculation:erp_cost_calculations(*)
      `)
      .order('name')
    
    if (error) throw error
    return data
  }

  static async createProduct(product: Tables['erp_products']['Insert']) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('erp_products')
      .insert({ ...product, user_id: user.id })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateProduct(id: string, product: Tables['erp_products']['Update']) {
    const { data, error } = await supabase
      .from('erp_products')
      .update(product)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async deleteProduct(id: string) {
    const { error } = await supabase
      .from('erp_products')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // BOM (Bill of Materials)
  static async createBOM(productId: string, bomData: {
    items: Array<{
      raw_material_id: string
      quantity: number
      unit: string
    }>
    production_steps: Array<{
      name: string
      description?: string
      time_minutes: number
      labor_cost_per_hour: number
      indirect_costs: number
      average_loss: number
      step_order: number
    }>
  }) {
    // Create BOM
    const { data: bom, error: bomError } = await supabase
      .from('erp_bom')
      .insert({
        product_id: productId,
        total_production_time: bomData.production_steps.reduce((total, step) => total + step.time_minutes, 0)
      })
      .select()
      .single()
    
    if (bomError) throw bomError

    // Create BOM items
    if (bomData.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('erp_bom_items')
        .insert(bomData.items.map(item => ({
          ...item,
          bom_id: bom.id
        })))
      
      if (itemsError) throw itemsError
    }

    // Create production steps
    if (bomData.production_steps.length > 0) {
      const { error: stepsError } = await supabase
        .from('erp_production_steps')
        .insert(bomData.production_steps.map(step => ({
          ...step,
          bom_id: bom.id
        })))
      
      if (stepsError) throw stepsError
    }

    return bom
  }

  static async updateBOM(bomId: string, bomData: {
    items: Array<{
      raw_material_id: string
      quantity: number
      unit: string
    }>
    production_steps: Array<{
      name: string
      description?: string
      time_minutes: number
      labor_cost_per_hour: number
      indirect_costs: number
      average_loss: number
      step_order: number
    }>
  }) {
    // Delete existing items and steps
    await supabase.from('erp_bom_items').delete().eq('bom_id', bomId)
    await supabase.from('erp_production_steps').delete().eq('bom_id', bomId)

    // Create new items
    if (bomData.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('erp_bom_items')
        .insert(bomData.items.map(item => ({
          ...item,
          bom_id: bomId
        })))
      
      if (itemsError) throw itemsError
    }

    // Create new steps
    if (bomData.production_steps.length > 0) {
      const { error: stepsError } = await supabase
        .from('erp_production_steps')
        .insert(bomData.production_steps.map(step => ({
          ...step,
          bom_id: bomId
        })))
      
      if (stepsError) throw stepsError
    }

    // Update total production time
    const { error: bomError } = await supabase
      .from('erp_bom')
      .update({
        total_production_time: bomData.production_steps.reduce((total, step) => total + step.time_minutes, 0)
      })
      .eq('id', bomId)
    
    if (bomError) throw bomError
  }

  // Production Orders
  static async getProductionOrders() {
    const { data, error } = await supabase
      .from('erp_production_orders')
      .select(`
        *,
        product:erp_products(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createProductionOrder(order: Tables['erp_production_orders']['Insert']) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('erp_production_orders')
      .insert({ ...order, user_id: user.id })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async updateProductionOrder(id: string, order: Tables['erp_production_orders']['Update']) {
    const { data, error } = await supabase
      .from('erp_production_orders')
      .update(order)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Stock Movements
  static async getStockMovements() {
    const { data, error } = await supabase
      .from('erp_stock_movements')
      .select(`
        *,
        raw_material:erp_raw_materials(*),
        production_order:erp_production_orders(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  static async createStockMovement(movement: Tables['erp_stock_movements']['Insert']) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('erp_stock_movements')
      .insert({ ...movement, user_id: user.id })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Cost Calculations
  static async getProductCostCalculation(productId: string) {
    const { data, error } = await supabase
      .from('erp_cost_calculations')
      .select('*')
      .eq('product_id', productId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async calculateProductCosts(productId: string) {
    const { data, error } = await supabase
      .rpc('calculate_product_costs', { product_uuid: productId })
    
    if (error) throw error
    return data[0]
  }

  // Dashboard Metrics
  static async getDashboardMetrics() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get products with cost calculations
    const { data: products, error: productsError } = await supabase
      .from('erp_products')
      .select(`
        *,
        cost_calculation:erp_cost_calculations(*)
      `)
      .eq('user_id', user.id)
    
    if (productsError) throw productsError

    // Get raw materials for stock analysis
    const { data: rawMaterials, error: materialsError } = await supabase
      .from('erp_raw_materials')
      .select('*')
      .eq('user_id', user.id)
    
    if (materialsError) throw materialsError

    // Calculate metrics
    const totalProducts = products.length
    const profitableProducts = products.filter(p => 
      p.cost_calculation?.[0]?.profit_margin > 0
    ).length
    const deficitaryProducts = products.filter(p => 
      p.cost_calculation?.[0]?.profit_margin <= 0
    ).length
    
    const averageProfitMargin = products.length > 0 
      ? products.reduce((sum, p) => sum + (p.cost_calculation?.[0]?.profit_margin_percentage || 0), 0) / products.length
      : 0

    const totalInventoryValue = rawMaterials.reduce((total, material) => 
      total + (material.current_stock * material.unit_cost), 0
    )

    const criticalStockItems = rawMaterials.filter(material => 
      material.current_stock <= material.minimum_stock
    ).length

    return {
      totalProducts,
      profitableProducts,
      deficitaryProducts,
      averageProfitMargin,
      totalInventoryValue,
      criticalStockItems,
      products,
      rawMaterials
    }
  }
}