import React from 'react';
import { useERP } from '../../contexts/ERPContext';
import { MetricCard } from './MetricCard';
import { ProductTable } from './ProductTable';
import { StockAlerts } from './StockAlerts';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  BarChart3,
  Loader
} from 'lucide-react';

export function Dashboard() {
  const { dashboardMetrics, rawMaterials, loading } = useERP();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Métricas principais - Grid 3x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Total de Produtos"
          value={dashboardMetrics.totalProducts}
          change={12}
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="Produtos Lucrativos"
          value={dashboardMetrics.profitableProducts}
          change={8}
          icon={TrendingUp}
          color="green"
        />
        <MetricCard
          title="Receita Total"
          value={dashboardMetrics.totalInventoryValue}
          change={15}
          icon={DollarSign}
          color="purple"
          format="currency"
        />
        <MetricCard
          title="Produtos Deficitários"
          value={dashboardMetrics.deficitaryProducts}
          change={5}
          icon={TrendingDown}
          color="orange"
        />
        <MetricCard
          title="Margem Média"
          value={dashboardMetrics.averageProfitMargin}
          change={10}
          icon={BarChart3}
          color="yellow"
          format="percentage"
        />
        <MetricCard
          title="Alertas de Estoque"
          value={dashboardMetrics.criticalStockItems}
          change={-5}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Seção de gráficos e tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Produtos mais lucrativos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">Produtos Mais Lucrativos</h3>
          </div>
          <ProductTable products={dashboardMetrics.topProfitableProducts} />
        </div>

        {/* Alertas de estoque */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <StockAlerts rawMaterials={rawMaterials} />
        </div>
      </div>

      {/* Produtos com pior desempenho */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Produtos com Pior Desempenho</h3>
        </div>
        <ProductTable products={dashboardMetrics.bottomPerformingProducts} showNegative />
      </div>
    </div>
  );
}