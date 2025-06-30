import React, { useState, useMemo } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { CostAnalysis } from './CostAnalysis';
import { ProfitabilityAnalysis } from './ProfitabilityAnalysis';
import { ProductionAnalysis } from './ProductionAnalysis';
import { TrendAnalysis } from './TrendAnalysis';
import { 
  BarChart3, 
  TrendingUp, 
  Factory, 
  Target,
  DollarSign,
  Package,
  AlertTriangle,
  Calendar
} from 'lucide-react';

export function AnalyticsDashboard() {
  const { products, rawMaterials, productionOrders } = useERP();
  const [activeTab, setActiveTab] = useState('overview');

  const analyticsData = useMemo(() => {
    // Calcular métricas gerais
    const totalProducts = products.length;
    const totalRawMaterials = rawMaterials.length;
    const totalOrders = productionOrders.length;
    const completedOrders = productionOrders.filter(o => o.status === 'COMPLETED').length;
    const inProgressOrders = productionOrders.filter(o => o.status === 'IN_PROGRESS').length;
    const plannedOrders = productionOrders.filter(o => o.status === 'PLANNED').length;

    // Calcular valor total do estoque
    const totalInventoryValue = rawMaterials.reduce((total, material) => 
      total + (material.currentStock * material.unitCost), 0
    );

    // Calcular itens críticos
    const criticalStockItems = rawMaterials.filter(material => 
      material.currentStock <= material.minimumStock
    ).length;

    // Calcular receita estimada das ordens concluídas
    const completedOrdersRevenue = productionOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((total, order) => {
        const product = products.find(p => p.id === order.productId);
        return total + (product ? product.salePrice * order.quantity : 0);
      }, 0);

    return {
      totalProducts,
      totalRawMaterials,
      totalOrders,
      completedOrders,
      inProgressOrders,
      plannedOrders,
      totalInventoryValue,
      criticalStockItems,
      completedOrdersRevenue,
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
    };
  }, [products, rawMaterials, productionOrders]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'costs', label: 'Análise de Custos', icon: DollarSign },
    { id: 'profitability', label: 'Rentabilidade', icon: TrendingUp },
    { id: 'production', label: 'Produção', icon: Factory },
    { id: 'trends', label: 'Tendências', icon: Target }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'costs':
        return <CostAnalysis />;
      case 'profitability':
        return <ProfitabilityAnalysis />;
      case 'production':
        return <ProductionAnalysis />;
      case 'trends':
        return <TrendAnalysis />;
      default:
        return (
          <div className="space-y-8">
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData.totalProducts}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-gray-500">Insumos cadastrados: {analyticsData.totalRawMaterials}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ordens de Produção</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{analyticsData.totalOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Factory className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600">Concluídas: {analyticsData.completedOrders}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-yellow-600">Em andamento: {analyticsData.inProgressOrders}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor do Estoque</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatCurrency(analyticsData.totalInventoryValue).replace('R$', '').trim()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-gray-500">Valor total em estoque</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Alertas Críticos</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{analyticsData.criticalStockItems}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-gray-500">Itens com estoque baixo</span>
                </div>
              </div>
            </div>

            {/* Gráficos de Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Taxa de Conclusão */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Performance de Produção</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Taxa de Conclusão</span>
                      <span className="text-sm font-bold text-green-600">
                        {analyticsData.completionRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${analyticsData.completionRate}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{analyticsData.plannedOrders}</p>
                      <p className="text-xs text-gray-500">Planejadas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{analyticsData.inProgressOrders}</p>
                      <p className="text-xs text-gray-500">Em Produção</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{analyticsData.completedOrders}</p>
                      <p className="text-xs text-gray-500">Concluídas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Receita das Ordens Concluídas */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Receita Realizada</h3>
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-600 mb-2">
                      {formatCurrency(analyticsData.completedOrdersRevenue)}
                    </p>
                    <p className="text-sm text-gray-500">Receita total das ordens concluídas</p>
                  </div>

                  {analyticsData.completedOrders > 0 && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Receita média por ordem:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(analyticsData.completedOrdersRevenue / analyticsData.completedOrders)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resumo por Categoria */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Resumo por Categoria</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Produtos por Categoria */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Produtos por Categoria</h4>
                  <div className="space-y-3">
                    {Object.entries(
                      products.reduce((acc, product) => {
                        acc[product.category] = (acc[product.category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{category}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status dos Insumos */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Status dos Insumos</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Estoque Normal</span>
                      <span className="text-sm font-medium text-green-600">
                        {rawMaterials.filter(m => m.currentStock > m.minimumStock * 1.5).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Estoque Baixo</span>
                      <span className="text-sm font-medium text-yellow-600">
                        {rawMaterials.filter(m => m.currentStock > m.minimumStock && m.currentStock <= m.minimumStock * 1.5).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Estoque Crítico</span>
                      <span className="text-sm font-medium text-red-600">
                        {analyticsData.criticalStockItems}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ordens por Status */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-4">Ordens por Status</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Planejadas</span>
                      <span className="text-sm font-medium text-blue-600">{analyticsData.plannedOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Em Produção</span>
                      <span className="text-sm font-medium text-yellow-600">{analyticsData.inProgressOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Concluídas</span>
                      <span className="text-sm font-medium text-green-600">{analyticsData.completedOrders}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Navegação por Abas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}