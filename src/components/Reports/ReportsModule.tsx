import React, { useState, useMemo } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { CostCalculationService } from '../../services/costCalculationService';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  TrendingUp, 
  Package, 
  Factory, 
  DollarSign,
  BarChart3,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Printer
} from 'lucide-react';

type ReportType = 'financial' | 'operational' | 'inventory' | 'production';

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  category: string;
  status: string;
  productId: string;
}

export function ReportsModule() {
  const { products, rawMaterials, productionOrders } = useERP();
  const [activeReport, setActiveReport] = useState<ReportType>('financial');
  const [filters, setFilters] = useState<ReportFilters>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    category: '',
    status: '',
    productId: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  };

  const reportCategories = [
    { 
      id: 'financial', 
      label: 'Financeiro', 
      icon: DollarSign, 
      color: 'blue',
      description: 'Análises de custos, receitas e rentabilidade'
    },
    { 
      id: 'operational', 
      label: 'Operacional', 
      icon: BarChart3, 
      color: 'green',
      description: 'Performance operacional e eficiência'
    },
    { 
      id: 'inventory', 
      label: 'Estoque', 
      icon: Package, 
      color: 'orange',
      description: 'Controle e análise de estoque'
    },
    { 
      id: 'production', 
      label: 'Produção', 
      icon: Factory, 
      color: 'purple',
      description: 'Relatórios de produção e ordens'
    }
  ];

  // Dados filtrados
  const filteredData = useMemo(() => {
    const fromDate = new Date(filters.dateFrom);
    const toDate = new Date(filters.dateTo);

    const filteredProducts = products.filter(product => {
      if (filters.category && product.category !== filters.category) return false;
      if (filters.productId && product.id !== filters.productId) return false;
      return product.status === 'active';
    });

    const filteredOrders = productionOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate < fromDate || orderDate > toDate) return false;
      if (filters.status && order.status !== filters.status) return false;
      if (filters.productId && order.productId !== filters.productId) return false;
      return true;
    });

    return { filteredProducts, filteredOrders };
  }, [products, productionOrders, filters]);

  // Relatórios por categoria
  const reportData = useMemo(() => {
    const productsWithCosts = filteredData.filteredProducts.map(product => {
      try {
        const calculation = CostCalculationService.calculateProductCost(product);
        return { product, calculation, hasValidCost: true };
      } catch {
        return { product, calculation: null, hasValidCost: false };
      }
    });

    return {
      financial: {
        totalRevenue: productsWithCosts.reduce((sum, p) => sum + p.product.salePrice, 0),
        totalCosts: productsWithCosts.reduce((sum, p) => sum + (p.calculation?.totalUnitCost || 0), 0),
        profitableProducts: productsWithCosts.filter(p => p.hasValidCost && (p.calculation?.profitMargin || 0) > 0).length,
        averageMargin: productsWithCosts.length > 0 
          ? productsWithCosts.reduce((sum, p) => sum + (p.calculation?.profitMarginPercentage || 0), 0) / productsWithCosts.length 
          : 0,
        topProducts: productsWithCosts
          .filter(p => p.hasValidCost)
          .sort((a, b) => (b.calculation?.profitMargin || 0) - (a.calculation?.profitMargin || 0))
          .slice(0, 5)
      },
      operational: {
        totalOrders: filteredData.filteredOrders.length,
        completedOrders: filteredData.filteredOrders.filter(o => o.status === 'COMPLETED').length,
        completionRate: filteredData.filteredOrders.length > 0 
          ? (filteredData.filteredOrders.filter(o => o.status === 'COMPLETED').length / filteredData.filteredOrders.length) * 100 
          : 0,
        averageOrderSize: filteredData.filteredOrders.length > 0 
          ? filteredData.filteredOrders.reduce((sum, order) => sum + order.quantity, 0) / filteredData.filteredOrders.length 
          : 0,
        productionEfficiency: 85 // Simulado
      },
      inventory: {
        totalValue: rawMaterials.reduce((sum, material) => sum + (material.currentStock * material.unitCost), 0),
        criticalItems: rawMaterials.filter(m => m.currentStock <= m.minimumStock).length,
        lowStockItems: rawMaterials.filter(m => m.currentStock > m.minimumStock && m.currentStock <= m.minimumStock * 1.5).length,
        totalItems: rawMaterials.length,
        turnoverRate: 4.2 // Simulado
      },
      production: {
        totalProduced: filteredData.filteredOrders
          .filter(o => o.status === 'COMPLETED')
          .reduce((sum, order) => sum + order.quantity, 0),
        ordersInProgress: filteredData.filteredOrders.filter(o => o.status === 'IN_PROGRESS').length,
        plannedOrders: filteredData.filteredOrders.filter(o => o.status === 'PLANNED').length,
        cancelledOrders: filteredData.filteredOrders.filter(o => o.status === 'CANCELLED').length,
        onTimeDelivery: 92 // Simulado
      }
    };
  }, [filteredData, rawMaterials]);

  const exportReport = (reportType: ReportType) => {
    const reportContent = {
      type: reportType,
      filters,
      generatedAt: new Date().toISOString(),
      data: reportData[reportType]
    };

    const dataStr = JSON.stringify(reportContent, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const printReport = () => {
    window.print();
  };

  const renderReportContent = () => {
    const data = reportData[activeReport];
    const category = reportCategories.find(c => c.id === activeReport);

    return (
      <div className="space-y-6">
        {/* Header do Relatório */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {category && (
                <div className={`w-12 h-12 bg-${category.color}-500 rounded-xl flex items-center justify-center`}>
                  <category.icon className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-gray-900">Relatório {category?.label}</h3>
                <p className="text-sm text-gray-600">{category?.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={printReport}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => exportReport(activeReport)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        {activeReport === 'financial' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Custos Totais</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.totalCosts)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Produtos Lucrativos</p>
                  <p className="text-2xl font-bold text-green-600">{data.profitableProducts}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Margem Média</p>
                  <p className="text-2xl font-bold text-purple-600">{data.averageMargin.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {activeReport === 'operational' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Ordens</p>
                  <p className="text-2xl font-bold text-blue-600">{data.totalOrders}</p>
                </div>
                <Factory className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold text-green-600">{data.completionRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tamanho Médio</p>
                  <p className="text-2xl font-bold text-purple-600">{data.averageOrderSize.toFixed(0)}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Eficiência</p>
                  <p className="text-2xl font-bold text-orange-600">{data.productionEfficiency}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {activeReport === 'inventory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.totalValue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Itens Críticos</p>
                  <p className="text-2xl font-bold text-red-600">{data.criticalItems}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-yellow-600">{data.lowStockItems}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Giro de Estoque</p>
                  <p className="text-2xl font-bold text-green-600">{data.turnoverRate}x</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {activeReport === 'production' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Produzido</p>
                  <p className="text-2xl font-bold text-blue-600">{data.totalProduced}</p>
                </div>
                <Factory className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Produção</p>
                  <p className="text-2xl font-bold text-yellow-600">{data.ordersInProgress}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Planejadas</p>
                  <p className="text-2xl font-bold text-purple-600">{data.plannedOrders}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Entrega no Prazo</p>
                  <p className="text-2xl font-bold text-green-600">{data.onTimeDelivery}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Detalhes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h4 className="text-lg font-semibold text-gray-900">Detalhamento</h4>
          </div>
          <div className="overflow-x-auto">
            {activeReport === 'financial' && (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Venda</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo Unit.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.financial.topProducts.map((item) => (
                    <tr key={item.product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                          <div className="text-sm text-gray-500">{item.product.code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.product.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(item.product.salePrice)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.hasValidCost ? formatCurrency(item.calculation?.totalUnitCost || 0) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {item.hasValidCost ? (
                          <span className={`text-sm font-medium ${
                            (item.calculation?.profitMargin || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(item.calculation?.profitMarginPercentage || 0).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Central de Relatórios</h2>
          <p className="text-gray-600">Análises detalhadas e insights do seu negócio</p>
        </div>
      </div>

      {/* Filtros Globais */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              {Array.from(new Set(products.map(p => p.category))).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="PLANNED">Planejado</option>
              <option value="IN_PROGRESS">Em Produção</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Produto</label>
            <select
              value={filters.productId}
              onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Categorias de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveReport(category.id as ReportType)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                activeReport === category.id
                  ? `border-${category.color}-500 bg-${category.color}-50 shadow-lg`
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-${category.color}-500 rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.label}</h3>
                  <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Conteúdo do Relatório */}
      {renderReportContent()}
    </div>
  );
}