import { Product, RawMaterial, CostCalculation, BillOfMaterials } from '../types';

export class CostCalculationService {
  static calculateRawMaterialsCost(bom: BillOfMaterials): number {
    return bom.items.reduce((total, item) => {
      const adjustedQuantity = item.quantity * (1 + item.rawMaterial.wastePercentage / 100);
      return total + (adjustedQuantity * item.rawMaterial.unitCost);
    }, 0);
  }

  static calculateLaborCost(bom: BillOfMaterials): number {
    return bom.productionSteps.reduce((total, step) => {
      const laborCost = (step.timeMinutes / 60) * step.laborCostPerHour;
      return total + laborCost;
    }, 0);
  }

  static calculateIndirectCosts(bom: BillOfMaterials): number {
    return bom.productionSteps.reduce((total, step) => {
      return total + step.indirectCosts;
    }, 0);
  }

  static calculateLossCost(
    rawMaterialsCost: number, 
    laborCost: number, 
    indirectCosts: number, 
    lossPercentage: number
  ): number {
    const baseCost = rawMaterialsCost + laborCost + indirectCosts;
    return baseCost * (lossPercentage / 100);
  }

  static calculateBreakEvenPoint(
    fixedCosts: number, 
    salePrice: number, 
    variableCostPerUnit: number
  ): number {
    const contributionMargin = salePrice - variableCostPerUnit;
    return contributionMargin > 0 ? fixedCosts / contributionMargin : 0;
  }

  static calculateProductCost(product: Product): CostCalculation {
    if (!product.bom) {
      throw new Error('Product must have a Bill of Materials to calculate costs');
    }

    const rawMaterialsCost = this.calculateRawMaterialsCost(product.bom);
    const laborCost = this.calculateLaborCost(product.bom);
    const indirectCosts = this.calculateIndirectCosts(product.bom);
    const lossCost = this.calculateLossCost(
      rawMaterialsCost, 
      laborCost, 
      indirectCosts, 
      product.averageLossPercentage
    );

    const totalProductionCost = rawMaterialsCost + laborCost + indirectCosts + lossCost;
    const totalUnitCost = totalProductionCost + product.allocatedFixedCost;
    const profitMargin = product.salePrice - totalUnitCost;
    const profitMarginPercentage = (profitMargin / product.salePrice) * 100;
    const contributionMargin = product.salePrice - totalProductionCost;
    const breakEvenPoint = this.calculateBreakEvenPoint(
      product.allocatedFixedCost, 
      product.salePrice, 
      totalProductionCost
    );

    return {
      productId: product.id,
      rawMaterialsCost,
      laborCost,
      indirectCosts,
      lossCost,
      totalProductionCost,
      fixedCostAllocation: product.allocatedFixedCost,
      totalUnitCost,
      profitMargin,
      profitMarginPercentage,
      breakEvenPoint,
      contributionMargin,
      calculatedAt: new Date()
    };
  }

  static simulatePriceImpact(
    product: Product, 
    newSalePrice: number
  ): CostCalculation {
    const originalPrice = product.salePrice;
    product.salePrice = newSalePrice;
    const calculation = this.calculateProductCost(product);
    product.salePrice = originalPrice; // restore original price
    return calculation;
  }

  static simulateVolumeForTargetProfit(
    product: Product, 
    targetProfit: number
  ): number {
    const calculation = this.calculateProductCost(product);
    if (calculation.contributionMargin <= 0) return 0;
    
    const requiredVolume = (product.allocatedFixedCost + targetProfit) / calculation.contributionMargin;
    return Math.ceil(requiredVolume);
  }

  static simulateRawMaterialImpact(
    product: Product, 
    rawMaterialId: string, 
    newCost: number
  ): CostCalculation {
    if (!product.bom) {
      throw new Error('Product must have a Bill of Materials');
    }

    // Create a copy of the product with updated raw material cost
    const updatedBOM = { ...product.bom };
    updatedBOM.items = updatedBOM.items.map(item => {
      if (item.rawMaterialId === rawMaterialId) {
        return {
          ...item,
          rawMaterial: { ...item.rawMaterial, unitCost: newCost }
        };
      }
      return item;
    });

    const updatedProduct = { ...product, bom: updatedBOM };
    return this.calculateProductCost(updatedProduct);
  }
}