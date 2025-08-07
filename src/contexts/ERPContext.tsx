import React, { createContext, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { Product, RawMaterial, Supplier, ProductionOrder, StockMovement, DashboardMetrics } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { CostCalculationService } from '../services/costCalculationService';
import { StockService } from '../services/stockService';

interface ERPContextType {
  // Data
  products: Product[];
  rawMaterials: RawMaterial[];
  suppliers: Supplier[];
  productionOrders: ProductionOrder[];
  stockMovements: StockMovement[];
  
  // Loading states
  loading: boolean;
  
  // Actions
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addRawMaterial: (material: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRawMaterial: (id: string, material: Partial<RawMaterial>) => Promise<void>;
  deleteRawMaterial: (id: string) => Promise<void>;
  
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  addProductionOrder: (order: Omit<ProductionOrder, 'id' | 'createdAt'>) => Promise<void>;
  updateProductionOrder: (id: string, order: Partial<ProductionOrder>) => Promise<void>;
  
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'createdAt'>) => Promise<void>;
  
  // Computed values
  dashboardMetrics: DashboardMetrics;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export function ERPProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data when user is authenticated
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // Clear data when user logs out
      setProducts([]);
      setRawMaterials([]);
      setSuppliers([]);
      setProductionOrders([]);
      setStockMovements([]);
      setLoading(false);
    }
  }, [user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSuppliers(),
        loadRawMaterials(),
        loadProducts(),
        loadProductionOrders(),
        loadStockMovements()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await SupabaseService.getSuppliers();
      const mappedSuppliers: Supplier[] = data.map(item => ({
        id: item.id,
        name: item.name,
        contact: item.contact || '',
        email: item.email || '',
        phone: item.phone || '',
        leadTime: item.lead_time
      }));
      setSuppliers(mappedSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadRawMaterials = async () => {
    try {
      const data = await SupabaseService.getRawMaterials();
      const mappedMaterials: RawMaterial[] = data.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        unit: item.unit,
        unitCost: Number(item.unit_cost),
        currentStock: Number(item.current_stock),
        minimumStock: Number(item.minimum_stock),
        wastePercentage: Number(item.waste_percentage),
        suppliers: item.suppliers?.map(s => ({
          id: s.id,
          name: s.name,
          contact: s.contact || '',
          email: s.email || '',
          phone: s.phone || '',
          leadTime: s.lead_time
        })) || [],
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
      setRawMaterials(mappedMaterials);
    } catch (error) {
      console.error('Error loading raw materials:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await SupabaseService.getProducts();
      const mappedProducts: Product[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        name: item.name,
        code: item.code,
        description: item.description || '',
        unit: item.unit,
        category: item.category,
        salePrice: Number(item.sale_price),
        costPrice: Number(item.cost_price || 0),
        allocatedFixedCost: Number(item.allocated_fixed_cost),
        productionTime: item.production_time,
        averageLossPercentage: Number(item.average_loss_percentage),
        status: item.status as 'active' | 'inactive',
        variations: item.variations?.map(variation => ({
          id: variation.id,
          productId: variation.product_id,
          name: variation.name,
          code: variation.code,
          salePrice: Number(variation.sale_price),
          costPrice: Number(variation.cost_price),
          stockQuantity: Number(variation.stock_quantity),
          minimumStock: Number(variation.minimum_stock),
          attributes: variation.attributes as Record<string, any>,
          status: variation.status as 'active' | 'inactive',
          createdAt: new Date(variation.created_at),
          updatedAt: new Date(variation.updated_at)
        })) || [],
        bom: item.bom ? {
          id: item.bom.id,
          productId: item.bom.product_id,
          items: item.bom.items?.map(bomItem => ({
            rawMaterialId: bomItem.raw_material_id,
            rawMaterial: {
              id: bomItem.raw_material.id,
              name: bomItem.raw_material.name,
              code: bomItem.raw_material.code,
              unit: bomItem.raw_material.unit,
              unitCost: Number(bomItem.raw_material.unit_cost),
              currentStock: Number(bomItem.raw_material.current_stock),
              minimumStock: Number(bomItem.raw_material.minimum_stock),
              wastePercentage: Number(bomItem.raw_material.waste_percentage),
              suppliers: [],
              createdAt: new Date(bomItem.raw_material.created_at),
              updatedAt: new Date(bomItem.raw_material.updated_at)
            },
            quantity: Number(bomItem.quantity),
            unit: bomItem.unit,
            wasteAdjustedQuantity: Number(bomItem.waste_adjusted_quantity)
          })) || [],
          productionSteps: item.bom.production_steps?.map(step => ({
            id: step.id,
            name: step.name,
            description: step.description || '',
            timeMinutes: step.time_minutes,
            laborCostPerHour: Number(step.labor_cost_per_hour),
            indirectCosts: Number(step.indirect_costs),
            averageLoss: Number(step.average_loss)
          })) || [],
          totalProductionTime: item.bom.total_production_time,
          createdAt: new Date(item.bom.created_at),
          updatedAt: new Date(item.bom.updated_at)
        } : undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadProductionOrders = async () => {
    try {
      const data = await SupabaseService.getProductionOrders();
      const mappedOrders: ProductionOrder[] = data.map(item => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        status: item.status,
        plannedDate: new Date(item.planned_date),
        completedDate: item.completed_date ? new Date(item.completed_date) : undefined,
        actualCost: item.actual_cost ? Number(item.actual_cost) : undefined,
        createdAt: new Date(item.created_at)
      }));
      setProductionOrders(mappedOrders);
    } catch (error) {
      console.error('Error loading production orders:', error);
    }
  };

  const loadStockMovements = async () => {
    try {
      const data = await SupabaseService.getStockMovements();
      const mappedMovements: StockMovement[] = data.map(item => ({
        id: item.id,
        rawMaterialId: item.raw_material_id,
        type: item.type,
        quantity: Number(item.quantity),
        reason: item.reason,
        productionOrderId: item.production_order_id || undefined,
        createdAt: new Date(item.created_at)
      }));
      setStockMovements(mappedMovements);
    } catch (error) {
      console.error('Error loading stock movements:', error);
    }
  };

  // Product actions
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const dbProduct = await SupabaseService.createProduct({
        name: productData.name,
        code: productData.code,
        description: productData.description,
        unit: productData.unit,
        category: productData.category,
        sale_price: productData.salePrice,
        cost_price: productData.costPrice,
        allocated_fixed_cost: productData.allocatedFixedCost,
        production_time: productData.productionTime,
        average_loss_percentage: productData.averageLossPercentage,
        status: productData.status || 'active'
      });

      // Create BOM if provided
      if (productData.bom && (productData.bom.items.length > 0 || productData.bom.productionSteps.length > 0)) {
        await SupabaseService.createBOM(dbProduct.id, {
          items: productData.bom.items.map(item => ({
            raw_material_id: item.rawMaterialId,
            quantity: item.quantity,
            unit: item.unit
          })),
          production_steps: productData.bom.productionSteps.map((step, index) => ({
            name: step.name,
            description: step.description,
            time_minutes: step.timeMinutes,
            labor_cost_per_hour: step.laborCostPerHour,
            indirect_costs: step.indirectCosts,
            average_loss: step.averageLoss,
            step_order: index + 1
          }))
        });
      }

      await loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const updateData: any = {};
      if (productData.name !== undefined) updateData.name = productData.name;
      if (productData.code !== undefined) updateData.code = productData.code;
      if (productData.unit !== undefined) updateData.unit = productData.unit;
      if (productData.category !== undefined) updateData.category = productData.category;
      if (productData.salePrice !== undefined) updateData.sale_price = productData.salePrice;
      if (productData.allocatedFixedCost !== undefined) updateData.allocated_fixed_cost = productData.allocatedFixedCost;
      if (productData.productionTime !== undefined) updateData.production_time = productData.productionTime;
      if (productData.averageLossPercentage !== undefined) updateData.average_loss_percentage = productData.averageLossPercentage;

      await SupabaseService.updateProduct(id, updateData);

      // Update BOM if provided
      if (productData.bom) {
        const product = products.find(p => p.id === id);
        if (product?.bom) {
          await SupabaseService.updateBOM(product.bom.id, {
            items: productData.bom.items.map(item => ({
              raw_material_id: item.rawMaterialId,
              quantity: item.quantity,
              unit: item.unit
            })),
            production_steps: productData.bom.productionSteps.map((step, index) => ({
              name: step.name,
              description: step.description,
              time_minutes: step.timeMinutes,
              labor_cost_per_hour: step.laborCostPerHour,
              indirect_costs: step.indirectCosts,
              average_loss: step.averageLoss,
              step_order: index + 1
            }))
          });
        } else if (productData.bom.items.length > 0 || productData.bom.productionSteps.length > 0) {
          await SupabaseService.createBOM(id, {
            items: productData.bom.items.map(item => ({
              raw_material_id: item.rawMaterialId,
              quantity: item.quantity,
              unit: item.unit
            })),
            production_steps: productData.bom.productionSteps.map((step, index) => ({
              name: step.name,
              description: step.description,
              time_minutes: step.timeMinutes,
              labor_cost_per_hour: step.laborCostPerHour,
              indirect_costs: step.indirectCosts,
              average_loss: step.averageLoss,
              step_order: index + 1
            }))
          });
        }
      }

      await loadProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await SupabaseService.deleteProduct(id);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  // Raw Material actions
  const addRawMaterial = async (materialData: Omit<RawMaterial, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const supplierIds = materialData.suppliers.map(s => s.id);
      await SupabaseService.createRawMaterial({
        name: materialData.name,
        code: materialData.code,
        unit: materialData.unit,
        unit_cost: materialData.unitCost,
        current_stock: materialData.currentStock,
        minimum_stock: materialData.minimumStock,
        waste_percentage: materialData.wastePercentage
      }, supplierIds);
      await loadRawMaterials();
    } catch (error) {
      console.error('Error adding raw material:', error);
      throw error;
    }
  };

  const updateRawMaterial = async (id: string, materialData: Partial<RawMaterial>) => {
    try {
      const updateData: any = {};
      if (materialData.name !== undefined) updateData.name = materialData.name;
      if (materialData.code !== undefined) updateData.code = materialData.code;
      if (materialData.unit !== undefined) updateData.unit = materialData.unit;
      if (materialData.unitCost !== undefined) updateData.unit_cost = materialData.unitCost;
      if (materialData.currentStock !== undefined) updateData.current_stock = materialData.currentStock;
      if (materialData.minimumStock !== undefined) updateData.minimum_stock = materialData.minimumStock;
      if (materialData.wastePercentage !== undefined) updateData.waste_percentage = materialData.wastePercentage;

      const supplierIds = materialData.suppliers?.map(s => s.id);
      await SupabaseService.updateRawMaterial(id, updateData, supplierIds);
      await loadRawMaterials();
    } catch (error) {
      console.error('Error updating raw material:', error);
      throw error;
    }
  };

  const deleteRawMaterial = async (id: string) => {
    try {
      await SupabaseService.deleteRawMaterial(id);
      await loadRawMaterials();
    } catch (error) {
      console.error('Error deleting raw material:', error);
      throw error;
    }
  };

  // Supplier actions
  const addSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
    try {
      await SupabaseService.createSupplier({
        name: supplierData.name,
        contact: supplierData.contact,
        email: supplierData.email,
        phone: supplierData.phone,
        lead_time: supplierData.leadTime
      });
      await loadSuppliers();
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
    }
  };

  const updateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    try {
      const updateData: any = {};
      if (supplierData.name !== undefined) updateData.name = supplierData.name;
      if (supplierData.contact !== undefined) updateData.contact = supplierData.contact;
      if (supplierData.email !== undefined) updateData.email = supplierData.email;
      if (supplierData.phone !== undefined) updateData.phone = supplierData.phone;
      if (supplierData.leadTime !== undefined) updateData.lead_time = supplierData.leadTime;

      await SupabaseService.updateSupplier(id, updateData);
      await loadSuppliers();
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await SupabaseService.deleteSupplier(id);
      await loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  };

  // Production Order actions
  const addProductionOrder = async (orderData: Omit<ProductionOrder, 'id' | 'createdAt'>) => {
    try {
      await SupabaseService.createProductionOrder({
        product_id: orderData.productId,
        quantity: orderData.quantity,
        status: orderData.status,
        planned_date: orderData.plannedDate.toISOString(),
        completed_date: orderData.completedDate?.toISOString(),
        actual_cost: orderData.actualCost
      });
      await loadProductionOrders();
    } catch (error) {
      console.error('Error adding production order:', error);
      throw error;
    }
  };

  const updateProductionOrder = async (id: string, orderData: Partial<ProductionOrder>) => {
    try {
      const updateData: any = {};
      if (orderData.productId !== undefined) updateData.product_id = orderData.productId;
      if (orderData.quantity !== undefined) updateData.quantity = orderData.quantity;
      if (orderData.status !== undefined) updateData.status = orderData.status;
      if (orderData.plannedDate !== undefined) updateData.planned_date = orderData.plannedDate.toISOString();
      if (orderData.completedDate !== undefined) updateData.completed_date = orderData.completedDate.toISOString();
      if (orderData.actualCost !== undefined) updateData.actual_cost = orderData.actualCost;

      await SupabaseService.updateProductionOrder(id, updateData);
      await loadProductionOrders();
    } catch (error) {
      console.error('Error updating production order:', error);
      throw error;
    }
  };

  // Stock Movement actions
  const addStockMovement = async (movementData: Omit<StockMovement, 'id' | 'createdAt'>) => {
    try {
      await SupabaseService.createStockMovement({
        raw_material_id: movementData.rawMaterialId,
        type: movementData.type,
        quantity: movementData.quantity,
        reason: movementData.reason,
        production_order_id: movementData.productionOrderId
      });
      await Promise.all([loadStockMovements(), loadRawMaterials()]);
    } catch (error) {
      console.error('Error adding stock movement:', error);
      throw error;
    }
  };

  // Dashboard metrics calculation
  const dashboardMetrics = useMemo((): DashboardMetrics => {
    const productCalculations = products.map(product => {
      try {
        const calculation = CostCalculationService.calculateProductCost(product);
        return { product, calculation };
      } catch {
        return null;
      }
    }).filter(Boolean) as Array<{ product: Product; calculation: any }>;

    const profitableProducts = productCalculations.filter(pc => pc.calculation.profitMargin > 0);
    const deficitaryProducts = productCalculations.filter(pc => pc.calculation.profitMargin <= 0);
    
    const averageProfitMargin = productCalculations.length > 0 
      ? productCalculations.reduce((sum, pc) => sum + pc.calculation.profitMarginPercentage, 0) / productCalculations.length
      : 0;

    const totalInventoryValue = StockService.calculateInventoryValue(rawMaterials);
    const criticalStockItems = StockService.getCriticalStockItems(rawMaterials).length;

    const sortedByProfit = [...productCalculations].sort((a, b) => b.calculation.profitMargin - a.calculation.profitMargin);
    
    return {
      totalProducts: products.length,
      profitableProducts: profitableProducts.length,
      deficitaryProducts: deficitaryProducts.length,
      averageProfitMargin,
      totalInventoryValue,
      criticalStockItems,
      topProfitableProducts: sortedByProfit.slice(0, 5).map(pc => ({
        product: pc.product,
        profitMargin: pc.calculation.profitMargin,
        contributionMargin: pc.calculation.contributionMargin
      })),
      bottomPerformingProducts: sortedByProfit.slice(-5).reverse().map(pc => ({
        product: pc.product,
        profitMargin: pc.calculation.profitMargin,
        contributionMargin: pc.calculation.contributionMargin
      }))
    };
  }, [products, rawMaterials]);

  const refreshData = async () => {
    await loadAllData();
  };

  const value: ERPContextType = {
    products,
    rawMaterials,
    suppliers,
    productionOrders,
    stockMovements,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addProductionOrder,
    updateProductionOrder,
    addStockMovement,
    dashboardMetrics,
    refreshData
  };

  return (
    <ERPContext.Provider value={value}>
      {children}
    </ERPContext.Provider>
  );
}

export function useERP() {
  const context = useContext(ERPContext);
  if (context === undefined) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
}