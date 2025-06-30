import React, { useMemo } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { CostCalculationService } from '../../services/costCalculationService';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Calendar, BarChart3 } from 'lucide-react';

export function TrendAnalysis() {
  const { products, rawMaterials, productionOrders } = useERP();

  const trendData = useMemo(() => {
    // Análise de tendências de preços de insumos
    const materialTrends = rawMaterials.map(material => {
      // Simular histórico de preços (em um sistema real, isso viria do banco de dados)
      const currentPrice = material.unitCost;
      const previousPrice = currentPrice * (0.9 + Math.random() * 0.2); // Simular preço anterior
      const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
      
      return {
        material,
        currentPrice,
        previousPrice,
        priceChange,
        trend: priceChange > 5 ? 'up' : priceChange < -5 ? 'down' : 'stable'
      };
    });

    // Análise de tendências de produção (últimos 6 meses)
    const productionTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthOrders = productionOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const orderMonthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        return orderMonthKey === monthKey;
      });

      const completedOrders = monthOrders.filter(o => o.status === 'COMPLETED');
      const totalQuantity = completedOrders.reduce((sum, order) => sum + order.quantity, 0);
      
      productionTrends.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        orders: monthOrders.length,
        completed: completedOrders.length,
        quantity: totalQuantity,
        efficiency: monthOrders.length > 0 ? (completedOrders.length / monthOrders.length) * 100 : 0
      });
    }

    // Calcular tendência de produção
    const recentProduction = productionTrends.slice(-3).reduce((sum, month) => sum + month.quantity, 0);
    const previousProduction = productionTrends.slice(0, 3).reduce((sum, month) => sum + month.quantity, 0);
    const productionTrend = previousProduction > 0 ? ((recentProduction - previousProduction) / previousProduction) * 100 : 0;

    // Análise de rentabilidade por período
    const profitabilityTrends = products.map(product => {
      try {
        const calculation = CostCalculationService.calculateProductCost(product);
        const profitMargin = product.salePrice - calculation.totalUnitCost;
        const profitMarginPercentage = (profitMargin / product.salePrice) * 100;
        
        // Simular tendência de rentabilidade
        const previousMargin = profitMarginPercentage * (0.8 + Math.random() * 0.4);
        const marginTrend = profitMarginPercentage - previousMargin;
        
        return {
          product,
          currentMargin: profitMarginPercentage,
          previousMargin,
          marginTrend,
          trend: marginTrend > 2 ? 'improving' : marginTrend < -2 ? 'declining' : 'stable'
        };
      } catch {
        return null;
      }
    }).filter(Boolean) as Array<{
      product: any;
      currentMargin: number;
      previousMargin: number;
      marginTrend: number;
      trend: string;
    }>;

    // Análise de estoque crítico
    const stockTrends = rawMaterials.map(material => {
      const stockLevel = (material.currentStock / material.minimumStock) * 100;
      const daysOfStock = material.currentStock / (material.minimumStock * 0.1); // Simular consumo diário
      
      return {
        material,
        stockLevel,
        daysOfStock,
        status: stockLevel <= 100 ? 'critical' : stockLevel <= 150 ? 'low' : 'normal'
      };
    });

    // Previsões e alertas
    const alerts = [];
    
    // Alertas de preço
    materialTrends.filter(t => t.trend === 'up' && t.priceChange > 10).forEach(trend => {
      alerts.push({
        type: 'price_increase',
        severity: 'high',
        message: `${trend.material.name} teve aumento de ${trend.priceChange.toFixed(1)}% no preço`,
        impact: 'Pode afetar custos de produção'
      });
    });

    // Alertas de estoque
    stockTrends.filter(s => s.status === 'critical').forEach(stock => {
      alerts.push({
        type: 'stock_critical',
        severity: 'high',
        message: `${stock.material.name} com estoque crítico`,
        impact: `Apenas ${stock.daysOfStock.toFixed(0)} dias de estoque restante`
      });
    });

    // Alertas de rentabilidade
    profitabilityTrends.filter(p => p.trend === 'declining' && p.marginTrend < -5).forEach(profit => {
      alerts.push({
        type: 'profitability_decline',
        severity: 'medium',
        message: `${profit.product.name} com queda na rentabilidade`,
        impact: `Margem reduziu ${Math.abs(profit.marginTrend).toFixed(1)} pontos percentuais`
      });
    });

    return {
      materialTrends,
      productionTrends,
      productionTrend,
      profitabilityTrends,
      stockTrends,
      alerts,
      summary: {
        materialsWithPriceIncrease: materialTrends.filter(t => t.trend === 'up').length,
        productsWithDecliningMargin: profitabilityTrends.filter(p => p.trend === 'declining').length,
        criticalStockItems: stockTrends.filter(s => s.status === 'critical').length,
        productionGrowth: productionTrend
      }
    };
  }, [products, rawMaterials, productionOrders]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Resumo de Tendências */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Insumos com Alta de Preço</p>
              <p className="text-2xl font-bold text-red-900 mt-2">
                {trendData.summary.materialsWithPriceIncrease}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Produtos em Declínio</p>
              <p className="text-2xl font-bold text-orange-900 mt-2">
                {trendData.summary.productsWithDecliningMargin}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Crescimento da Produção</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {formatPercentage(trendData.summary.productionGrowth)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Alertas Críticos</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {trendData.alerts.filter(a => a.severity === 'high').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Alertas e Previsões */}
      {trendData.alerts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
            Alertas e Previsões
          </h3>
          <div className="space-y-3">
            {trendData.alerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm mt-1 opacity-80">{alert.impact}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    alert.severity === 'high' ? 'bg-red-200 text-red-800' :
                    alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {alert.severity === 'high' ? 'Alto' : alert.severity === 'medium' ? 'Médio' : 'Baixo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tendência de Produção */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Calendar className="w-5 h-5 text-blue-500 mr-2" />
          Tendência de Produção (6 Meses)
        </h3>
        <div className="space-y-4">
          {trendData.productionTrends.map((month, index) => {
            const isGrowing = index > 0 && month.quantity > trendData.productionTrends[index - 1].quantity;
            return (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {month.month.split(' ')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{month.month}</p>
                    <p className="text-xs text-gray-500">{month.orders} ordens criadas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900">{month.quantity}</p>
                    <p className="text-xs text-gray-500">unidades</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${month.efficiency >= 80 ? 'text-green-600' : month.efficiency >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {formatPercentage(month.efficiency)}
                    </p>
                    <p className="text-xs text-gray-500">eficiência</p>
                  </div>
                  <div className="flex items-center">
                    {index > 0 && (
                      isGrowing ? 
                        <TrendingUp className="w-5 h-5 text-green-500" /> :
                        <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tendências de Preços de Insumos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Tendências de Preços de Insumos</h3>
          <div className="space-y-3">
            {trendData.materialTrends
              .sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange))
              .slice(0, 8)
              .map((trend) => (
                <div key={trend.material.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTrendIcon(trend.trend)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{trend.material.name}</p>
                      <p className="text-xs text-gray-500">{trend.material.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(trend.currentPrice)}</p>
                    <p className={`text-xs font-medium ${
                      trend.priceChange > 0 ? 'text-red-600' : trend.priceChange < 0 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {trend.priceChange > 0 ? '+' : ''}{formatPercentage(trend.priceChange)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Tendências de Rentabilidade */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Tendências de Rentabilidade</h3>
          <div className="space-y-3">
            {trendData.profitabilityTrends
              .sort((a, b) => Math.abs(b.marginTrend) - Math.abs(a.marginTrend))
              .slice(0, 8)
              .map((trend) => (
                <div key={trend.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTrendIcon(trend.trend)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{trend.product.name}</p>
                      <p className="text-xs text-gray-500">{trend.product.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatPercentage(trend.currentMargin)}</p>
                    <p className={`text-xs font-medium ${
                      trend.marginTrend > 0 ? 'text-green-600' : trend.marginTrend < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {trend.marginTrend > 0 ? '+' : ''}{formatPercentage(trend.marginTrend)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Status do Estoque */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Análise de Estoque por Criticidade</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['critical', 'low', 'normal'].map(status => {
            const items = trendData.stockTrends.filter(s => s.status === status);
            const statusConfig = {
              critical: { label: 'Crítico', color: 'text-red-600 bg-red-100', icon: AlertTriangle },
              low: { label: 'Baixo', color: 'text-yellow-600 bg-yellow-100', icon: TrendingDown },
              normal: { label: 'Normal', color: 'text-green-600 bg-green-100', icon: Target }
            };
            const config = statusConfig[status as keyof typeof statusConfig];
            const Icon = config.icon;

            return (
              <div key={status} className="space-y-3">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                  <Icon className="w-4 h-4 mr-1" />
                  {config.label} ({items.length})
                </div>
                <div className="space-y-2">
                  {items.slice(0, 5).map(item => (
                    <div key={item.material.id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-900">{item.material.name}</span>
                      <span className="text-gray-500">{item.daysOfStock.toFixed(0)} dias</span>
                    </div>
                  ))}
                  {items.length > 5 && (
                    <p className="text-xs text-gray-500">+{items.length - 5} outros itens</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}