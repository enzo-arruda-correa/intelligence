export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  leadTime: number; // dias
}

export interface RawMaterial {
  id: string;
  name: string;
  code: string;
  unit: string;
  unitCost: number;
  currentStock: number;
  minimumStock: number;
  suppliers: Supplier[];
  wastePercentage: number; // percentual médio de desperdício
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductionStep {
  id: string;
  name: string;
  description: string;
  timeMinutes: number;
  laborCostPerHour: number;
  indirectCosts: number; // energia, depreciação, etc.
  averageLoss: number; // perda média do processo
}

export interface BOMItem {
  rawMaterialId: string;
  rawMaterial: RawMaterial;
  quantity: number;
  unit: string;
  wasteAdjustedQuantity: number;
}

export interface BillOfMaterials {
  id: string;
  productId: string;
  items: BOMItem[];
  productionSteps: ProductionStep[];
  totalProductionTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  unit: string;
  category: string;
  salePrice: number;
  allocatedFixedCost: number;
  productionTime: number; // minutos
  averageLossPercentage: number;
  bom?: BillOfMaterials;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostCalculation {
  productId: string;
  rawMaterialsCost: number;
  laborCost: number;
  indirectCosts: number;
  lossCost: number;
  totalProductionCost: number;
  fixedCostAllocation: number;
  totalUnitCost: number;
  profitMargin: number;
  profitMarginPercentage: number;
  breakEvenPoint: number;
  contributionMargin: number;
  calculatedAt: Date;
}

export interface StockMovement {
  id: string;
  rawMaterialId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  productionOrderId?: string;
  createdAt: Date;
}

export interface ProductionOrder {
  id: string;
  productId: string;
  quantity: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  plannedDate: Date;
  completedDate?: Date;
  actualCost?: number;
  createdAt: Date;
}

export interface DashboardMetrics {
  totalProducts: number;
  profitableProducts: number;
  deficitaryProducts: number;
  averageProfitMargin: number;
  totalInventoryValue: number;
  criticalStockItems: number;
  topProfitableProducts: Array<{
    product: Product;
    profitMargin: number;
    contributionMargin: number;
  }>;
  bottomPerformingProducts: Array<{
    product: Product;
    profitMargin: number;
    contributionMargin: number;
  }>;
}