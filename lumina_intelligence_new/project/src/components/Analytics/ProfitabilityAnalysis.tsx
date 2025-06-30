import React, { useMemo } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { CostCalculationService } from '../../services/costCalculationService';
import { TrendingUp, TrendingDown, Target, DollarSign, Percent, AlertTriangle } from 'lucide-react';

export function ProfitabilityAnalysis() {
  const { products, productionOrders } = useERP();

  const profitabilityData = useMemo(() => {
    const productProfitability = products.map(product => {
      try {
        const calculation = CostCalculationService.calculateProductCost(product);
        const profitMargin = product.salePrice - calculation.totalUnitCost;
        const profitMarginPercentage = (profitMargin / product.salePrice) * 100;
        const contributionMargin = product.salePrice - calculation.totalProductionCost;
        const contributionMarginPercentage = (contributionMargin / product.salePrice) * 100;

        return {
          product,
          calculation,
          profitMargin,
          profitMarginPercentage,
          contributionMargin,
          contributionMarginPercentage,
          breakEvenPoint: calculation.breakEvenPoint,
          roi: profitMarginPercentage
        };
      } catch {
        return null;
      }
    }).filter(Boolean) as Array<{
      product: any;
      calculation: any;
      profitMargin: number;
      profitMarginPercentage: number;
      contributionMargin: number;
      contributionMarginPercentage: number;
      breakEvenPoint: number;
      roi: number;
    }>;

    // Produtos mais lucrativos
    const mostProfitable = [...productProfitability]
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, 5);

    // Produtos menos lucrativos
    const leastProfitable = [...productProfitability]
      .sort((a, b) => a.profitMargin - b.profitMargin)
      .slice(0, 5);

    // Produtos com melhor ROI
    const bestROI = [...productProfitability]
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 5);

    // Produtos deficitários
    const unprofitableProducts = productProfitability.filter(item => item.profitMargin < 0);

    // Análise de rentabilidade por categoria
    const profitabilityByCategory = productProfitability.reduce((acc, item) => {
      const category = item.product.category;
      if (!acc[category]) {
        acc[category] = {
          totalProfit: 0,
          averageMargin: 0,
          productCount: 0,
          totalRevenue: 0,
          profitableProducts: 0
        };
      }
      
      acc[category].totalProfit += item.profitMargin;
      acc[category].totalRevenue += item.product.salePrice;
      acc[category].productCount += 1;
      if (item.profitMargin > 0) acc[category].profitableProducts += 1;
      acc[category].averageMargin = (acc[category].totalProfit / acc[category].totalRevenue) * 100;
      
      return acc;
    }, {} as Record<string, any>);

    // Métricas gerais
    const totalProducts = productProfitability.length;
    const profitableProducts = productProfitability.filter(item => item.profitMargin > 0).length;
    const averageProfitMargin = totalProducts > 0 
      ? productProfitability.reduce((sum, item) => sum + item.profitMarginPercentage, 0) / totalProducts
      : 0;

    // Análise de ordens de produção realizadas
    const completedOrders = productionOrders.filter(order => order.status === 'COMPLETED');
    const totalRevenueFromOrders = completedOrders.reduce((total, order) => {
      const product = products.find(p => p.id === order.productId);
      return total + (product ? product.salePrice * order.quantity : 0);
    }, 0);

    const totalCostFromOrders = completedOrders.reduce((total, order) => {
      return total + (order.actualCost || 0);
    }, 0);

    const realizedProfit = totalRevenueFromOrders - totalCostFromOrders;

    return {
      productProfitability,
      mostProfitable,
      leastProfitable,
      bestROI,
      unprofitableProducts,
      profitabilityByCategory,
      metrics: {
        totalProducts,
        profitableProducts,
        unprofitableProducts: unprofitableProducts.length,
        averageProfitMargin,
        profitabilityRate: (profitableProducts / totalProducts) * 100
      },
      ordersAnalysis: {
        totalRevenue: totalRevenueFromOrders,
        totalCost: totalCostFromOrders,
        realizedProfit,
        profitMargin: totalRevenueFromOrders > 0 ? (realizedProfit / totalRevenueFromOrders) * 100 : 0
      }
    };
  }, [products, productionOrders]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-8">
      {/* Métricas Principais de Rentabilidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Produtos Lucrativos</p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {profitabilityData.metrics.profitableProducts}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {formatPercentage(profitabilityData.metrics.profitabilityRate)} do total
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Margem Média</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {formatPercentage(profitabilityData.metrics.averageProfitMargin)}
              </p>
            </div>
            <Percent className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Lucro Realizado</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {formatCurrency(profitabilityData.ordersAnalysis.realizedProfit)}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Margem: {formatPercentage(profitabilityData.ordersAnalysis.profitMargin)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Produtos Deficitários</p>
              <p className="text-2xl font-bold text-red-900 mt-2">
                {profitabilityData.metrics.unprofitableProducts}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Análise de Ordens Realizadas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance Financeira das Ordens</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 text-center">
            <p className="text-sm font-medium text-blue-700 mb-2">Receita Total</p>
            <p className="text-3xl font-bold text-blue-900">
              {formatCurrency(profitabilityData.ordersAnalysis.totalRevenue)}
            </p>
          </div>
          
          <div className="bg-orange-50 rounded-xl p-6 text-center">
            <p className="text-sm font-medium text-orange-700 mb-2">Custo Total</p>
            <p className="text-3xl font-bold text-orange-900">
              {formatCurrency(profitabilityData.ordersAnalysis.totalCost)}
            </p>
          </div>
          
          <div className={`rounded-xl p-6 text-center ${
            profitabilityData.ordersAnalysis.realizedProfit >= 0 
              ? 'bg-green-50' 
              : 'bg-red-50'
          }`}>
            <p className={`text-sm font-medium mb-2 ${
              profitabilityData.ordersAnalysis.realizedProfit >= 0 
                ? 'text-green-700' 
                : 'text-red-700'
            }`}>
              Lucro Líquido
            </p>
            <p className={`text-3xl font-bold ${
              profitabilityData.ordersAnalysis.realizedProfit >= 0 
                ? 'text-green-900' 
                : 'text-red-900'
            }`}>
              {formatCurrency(profitabilityData.ordersAnalysis.realizedProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* Rentabilidade por Categoria */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Rentabilidade por Categoria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(profitabilityData.profitabilityByCategory).map(([category, data]) => (
            <div key={category} className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{category}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Produtos:</span>
                  <span className="font-medium">{data.productCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lucrativos:</span>
                  <span className="font-medium text-green-600">{data.profitableProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Margem Média:</span>
                  <span className={`font-bold ${data.averageMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(data.averageMargin)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Produtos Mais Lucrativos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
            Produtos Mais Lucrativos
          </h3>
          <div className="space-y-3">
            {profitabilityData.mostProfitable.map((item, index) => (
              <div key={item.product.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{item.product.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{formatCurrency(item.profitMargin)}</p>
                  <p className="text-xs text-green-500">{formatPercentage(item.profitMarginPercentage)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Produtos com Melhor ROI */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Target className="w-5 h-5 text-blue-500 mr-2" />
            Melhor Retorno sobre Investimento
          </h3>
          <div className="space-y-3">
            {profitabilityData.bestROI.map((item, index) => (
              <div key={item.product.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Ponto de Equilíbrio: {Math.round(item.breakEvenPoint)} un</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{formatPercentage(item.roi)}</p>
                  <p className="text-xs text-blue-500">ROI</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Produtos Deficitários */}
      {profitabilityData.unprofitableProducts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            Produtos Deficitários - Atenção Necessária
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profitabilityData.unprofitableProducts.map((item) => (
              <div key={item.product.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{item.product.code}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600">
                    {formatCurrency(item.profitMargin)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Preço de Venda:</span>
                    <p className="font-medium">{formatCurrency(item.product.salePrice)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Custo Total:</span>
                    <p className="font-medium">{formatCurrency(item.calculation.totalUnitCost)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Margem:</span>
                    <p className="font-medium text-red-600">{formatPercentage(item.profitMarginPercentage)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ponto Equilíbrio:</span>
                    <p className="font-medium">{Math.round(item.breakEvenPoint)} un</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}