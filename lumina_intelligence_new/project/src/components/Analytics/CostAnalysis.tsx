import React, { useMemo } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { CostCalculationService } from '../../services/costCalculationService';
import { DollarSign, TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';

export function CostAnalysis() {
  const { products, rawMaterials } = useERP();

  const costAnalysis = useMemo(() => {
    const productCosts = products.map(product => {
      try {
        const calculation = CostCalculationService.calculateProductCost(product);
        return {
          product,
          calculation,
          costPerUnit: calculation.totalUnitCost,
          rawMaterialCost: calculation.rawMaterialsCost,
          laborCost: calculation.laborCost,
          indirectCosts: calculation.indirectCosts,
          lossCost: calculation.lossCost
        };
      } catch {
        return null;
      }
    }).filter(Boolean) as Array<{
      product: any;
      calculation: any;
      costPerUnit: number;
      rawMaterialCost: number;
      laborCost: number;
      indirectCosts: number;
      lossCost: number;
    }>;

    // Análise de custos por categoria
    const costsByCategory = productCosts.reduce((acc, item) => {
      const category = item.product.category;
      if (!acc[category]) {
        acc[category] = {
          totalCost: 0,
          averageCost: 0,
          productCount: 0,
          rawMaterialCost: 0,
          laborCost: 0,
          indirectCosts: 0,
          lossCost: 0
        };
      }
      
      acc[category].totalCost += item.costPerUnit;
      acc[category].rawMaterialCost += item.rawMaterialCost;
      acc[category].laborCost += item.laborCost;
      acc[category].indirectCosts += item.indirectCosts;
      acc[category].lossCost += item.lossCost;
      acc[category].productCount += 1;
      acc[category].averageCost = acc[category].totalCost / acc[category].productCount;
      
      return acc;
    }, {} as Record<string, any>);

    // Produtos com maior custo
    const highestCostProducts = [...productCosts]
      .sort((a, b) => b.costPerUnit - a.costPerUnit)
      .slice(0, 5);

    // Produtos com menor custo
    const lowestCostProducts = [...productCosts]
      .sort((a, b) => a.costPerUnit - b.costPerUnit)
      .slice(0, 5);

    // Análise de insumos mais caros
    const expensiveMaterials = [...rawMaterials]
      .sort((a, b) => b.unitCost - a.unitCost)
      .slice(0, 10);

    // Custo total do estoque
    const totalInventoryCost = rawMaterials.reduce((total, material) => 
      total + (material.currentStock * material.unitCost), 0
    );

    // Distribuição de custos
    const totalRawMaterialCost = productCosts.reduce((sum, item) => sum + item.rawMaterialCost, 0);
    const totalLaborCost = productCosts.reduce((sum, item) => sum + item.laborCost, 0);
    const totalIndirectCosts = productCosts.reduce((sum, item) => sum + item.indirectCosts, 0);
    const totalLossCost = productCosts.reduce((sum, item) => sum + item.lossCost, 0);
    const grandTotal = totalRawMaterialCost + totalLaborCost + totalIndirectCosts + totalLossCost;

    return {
      productCosts,
      costsByCategory,
      highestCostProducts,
      lowestCostProducts,
      expensiveMaterials,
      totalInventoryCost,
      costDistribution: {
        rawMaterials: { value: totalRawMaterialCost, percentage: (totalRawMaterialCost / grandTotal) * 100 },
        labor: { value: totalLaborCost, percentage: (totalLaborCost / grandTotal) * 100 },
        indirect: { value: totalIndirectCosts, percentage: (totalIndirectCosts / grandTotal) * 100 },
        loss: { value: totalLossCost, percentage: (totalLossCost / grandTotal) * 100 }
      }
    };
  }, [products, rawMaterials]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Métricas Principais de Custo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Custo Médio por Produto</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {costAnalysis.productCosts.length > 0 
                  ? formatCurrency(costAnalysis.productCosts.reduce((sum, item) => sum + item.costPerUnit, 0) / costAnalysis.productCosts.length)
                  : 'R$ 0,00'
                }
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Valor Total do Estoque</p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {formatCurrency(costAnalysis.totalInventoryCost)}
              </p>
            </div>
            <Package className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Maior Custo Unitário</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {costAnalysis.highestCostProducts.length > 0 
                  ? formatCurrency(costAnalysis.highestCostProducts[0].costPerUnit)
                  : 'R$ 0,00'
                }
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Menor Custo Unitário</p>
              <p className="text-2xl font-bold text-orange-900 mt-2">
                {costAnalysis.lowestCostProducts.length > 0 
                  ? formatCurrency(costAnalysis.lowestCostProducts[0].costPerUnit)
                  : 'R$ 0,00'
                }
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Distribuição de Custos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Distribuição de Custos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-900">Insumos</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(costAnalysis.costDistribution.rawMaterials.value)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">{costAnalysis.costDistribution.rawMaterials.percentage.toFixed(1)}%</p>
                <div className="w-16 bg-blue-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${costAnalysis.costDistribution.rawMaterials.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-900">Mão de Obra</p>
                <p className="text-lg font-bold text-green-900">{formatCurrency(costAnalysis.costDistribution.labor.value)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-700">{costAnalysis.costDistribution.labor.percentage.toFixed(1)}%</p>
                <div className="w-16 bg-green-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${costAnalysis.costDistribution.labor.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-purple-900">Custos Indiretos</p>
                <p className="text-lg font-bold text-purple-900">{formatCurrency(costAnalysis.costDistribution.indirect.value)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-700">{costAnalysis.costDistribution.indirect.percentage.toFixed(1)}%</p>
                <div className="w-16 bg-purple-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${costAnalysis.costDistribution.indirect.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-red-900">Perdas</p>
                <p className="text-lg font-bold text-red-900">{formatCurrency(costAnalysis.costDistribution.loss.value)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-700">{costAnalysis.costDistribution.loss.percentage.toFixed(1)}%</p>
                <div className="w-16 bg-red-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${costAnalysis.costDistribution.loss.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Custos por Categoria</h4>
            <div className="space-y-3">
              {Object.entries(costAnalysis.costsByCategory).map(([category, data]) => (
                <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{category}</p>
                    <p className="text-xs text-gray-500">{data.productCount} produtos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(data.averageCost)}</p>
                    <p className="text-xs text-gray-500">custo médio</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Produtos com Maior Custo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 text-red-500 mr-2" />
            Produtos com Maior Custo
          </h3>
          <div className="space-y-3">
            {costAnalysis.highestCostProducts.map((item, index) => (
              <div key={item.product.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{item.product.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{formatCurrency(item.costPerUnit)}</p>
                  <p className="text-xs text-gray-500">custo unitário</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insumos Mais Caros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
            Insumos Mais Caros
          </h3>
          <div className="space-y-3">
            {costAnalysis.expensiveMaterials.slice(0, 5).map((material, index) => (
              <div key={material.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{material.name}</p>
                    <p className="text-xs text-gray-500">{material.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-600">{formatCurrency(material.unitCost)}</p>
                  <p className="text-xs text-gray-500">por {material.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}