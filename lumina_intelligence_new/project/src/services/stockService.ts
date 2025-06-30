import { RawMaterial, StockMovement, ProductionOrder, BillOfMaterials } from '../types';

export class StockService {
  static calculateStockConsumption(bom: BillOfMaterials, quantity: number): Map<string, number> {
    const consumption = new Map<string, number>();
    
    bom.items.forEach(item => {
      const adjustedQuantity = item.quantity * (1 + item.rawMaterial.wastePercentage / 100);
      const totalConsumption = adjustedQuantity * quantity;
      consumption.set(item.rawMaterialId, totalConsumption);
    });

    return consumption;
  }

  static predictStockRupture(
    rawMaterial: RawMaterial, 
    dailyConsumption: number
  ): number {
    if (dailyConsumption <= 0) return Infinity;
    return Math.floor(rawMaterial.currentStock / dailyConsumption);
  }

  static calculatePurchaseSuggestion(
    rawMaterial: RawMaterial, 
    projectedConsumption: number, 
    daysToProject: number = 30
  ): number {
    const projectedStock = rawMaterial.currentStock - (projectedConsumption * daysToProject);
    const safetyStock = rawMaterial.minimumStock * 1.2; // 20% safety margin
    
    if (projectedStock < safetyStock) {
      const leadTimeConsumption = projectedConsumption * rawMaterial.suppliers[0]?.leadTime || 0;
      return Math.max(0, safetyStock - projectedStock + leadTimeConsumption);
    }
    
    return 0;
  }

  static processProductionOrder(
    productionOrder: ProductionOrder, 
    bom: BillOfMaterials,
    rawMaterials: RawMaterial[]
  ): { success: boolean; insufficientMaterials: string[] } {
    const consumption = this.calculateStockConsumption(bom, productionOrder.quantity);
    const insufficientMaterials: string[] = [];

    // Check if we have enough stock
    consumption.forEach((requiredQuantity, materialId) => {
      const material = rawMaterials.find(rm => rm.id === materialId);
      if (!material || material.currentStock < requiredQuantity) {
        insufficientMaterials.push(material?.name || materialId);
      }
    });

    if (insufficientMaterials.length > 0) {
      return { success: false, insufficientMaterials };
    }

    // Process stock movements
    consumption.forEach((requiredQuantity, materialId) => {
      const material = rawMaterials.find(rm => rm.id === materialId);
      if (material) {
        material.currentStock -= requiredQuantity;
      }
    });

    return { success: true, insufficientMaterials: [] };
  }

  static getCriticalStockItems(rawMaterials: RawMaterial[]): RawMaterial[] {
    return rawMaterials.filter(material => 
      material.currentStock <= material.minimumStock
    );
  }

  static calculateInventoryValue(rawMaterials: RawMaterial[]): number {
    return rawMaterials.reduce((total, material) => 
      total + (material.currentStock * material.unitCost), 0
    );
  }
}