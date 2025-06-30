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
  PieChart,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

type ReportType = 'products' | 'production' | 'costs' | 'inventory' | 'profitability' | 'trends';

interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  category: string;
  status: string;
  productId: string;
}

export function ReportsModule() {
  const { products, rawMaterials, productionOrders } = useERP();
  const [activeReport, setActiveReport] = useState<ReportType>('products');
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

  const reportTypes = [
    { id: 'products', label: 'Relatório de Produtos', icon: Package, color: 'blue' },
    { id: 'production', label: 'Relatório de Produção', icon: Factory, color: 'green' },
    { id: 'costs', label: 'Relatório de Custos', icon: DollarSign, color: 'purple' },
    { id: 'inventory', label: 'Relatório de Estoque', icon: BarChart3, color: 'orange' },
    { id: 'profitability', label: 'Relatório de Rentabilidade', icon: TrendingUp, color: 'emerald' },
    { id: 'trends', label: 'Análise de Tendências', icon: PieChart, color: 'red' }
  ];

  // Dados filtrados
  const filteredData = useMemo(() => {
    const fromDate = new Date(filters.dateFrom);
    const toDate = new Date(filters.dateTo);

    const filteredProducts = products.filter(product => {
      if (filters.category && product.category !== filters.category) return false;
      if (filters.productId && product.id !== filters.productId) return false;
      return true;
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

  // Relatório de Produtos
  const productsReport = useMemo(() => {
    return filteredData.filteredProducts.map(product => {
      try {
        const calculation = CostCalculationService.calculateProductCost(product);
        return {
          product,
          calculation,
          hasValidCost: true
        };
      } catch {
        return {
          product,
          calculation: null,
          hasValidCost: false
        };
      }
    });
  }, [filteredData.filteredProducts]);

  // Relatório de Produção
  const productionReport = useMemo(() => {
    const ordersByStatus = {
      PLANNED: filteredData.filteredOrders.filter(o => o.status === 'PLANNED'),
      IN_PROGRESS: filteredData.filteredOrders.filter(o => o.status === 'IN_PROGRESS'),
      COMPLETED: filteredData.filteredOrders.filter(o => o.status === 'COMPLETED'),
      CANCELLED: filteredData.filteredOrders.filter(o => o.status === 'CANCELLED')
    };

    const totalQuantityProduced = ordersByStatus.COMPLETED.reduce((sum, order) => sum + order.quantity, 0);
    const averageOrderSize = filteredData.filteredOrders.length > 0 
      ? filteredData.filteredOrders.reduce((sum, order) => sum + order.quantity, 0) / filteredData.filteredOrders.length 
      : 0;

    const completionRate = filteredData.filteredOrders.length > 0 
      ? (ordersByStatus.COMPLETED.length / filteredData.filteredOrders.length) * 100 
      : 0;

    return {
      ordersByStatus,
      totalQuantityProduced,
      averageOrderSize,
      completionRate,
      totalOrders: filteredData.filteredOrders.length
    };
  }, [filteredData.filteredOrders]);

  // Relatório de Custos
  const costsReport = useMemo(() => {
    const productCosts = productsReport.filter(p => p.hasValidCost);
    
    const totalRawMaterialsCost = productCosts.reduce((sum, p) => sum + (p.calculation?.rawMaterialsCost || 0), 0);
    const totalLaborCost = productCosts.reduce((sum, p) => sum + (p.calculation?.laborCost || 0), 0);
    const totalIndirectCosts = productCosts.reduce((sum, p) => sum + (p.calculation?.indirectCosts || 0), 0);
    const totalLossCost = productCosts.reduce((sum, p) => sum + (p.calculation?.lossCost || 0), 0);
    const totalCost = totalRawMaterialsCost + totalLaborCost + totalIndirectCosts + totalLossCost;

    const costsByCategory = productCosts.reduce((acc, item) => {
      const category = item.product.category;
      if (!acc[category]) {
        acc[category] = {
          totalCost: 0,
          productCount: 0,
          averageCost: 0
        };
      }
      acc[category].totalCost += item.calculation?.totalUnitCost || 0;
      acc[category].productCount += 1;
      acc[category].averageCost = acc[category].totalCost / acc[category].productCount;
      return acc;
    }, {} as Record<string, any>);

    return {
      totalRawMaterialsCost,
      totalLaborCost,
      totalIndirectCosts,
      totalLossCost,
      totalCost,
      costsByCategory,
      averageCostPerProduct: productCosts.length > 0 ? totalCost / productCosts.length : 0
    };
  }, [productsReport]);

  // Relatório de Estoque
  const inventoryReport = useMemo(() => {
    const totalValue = rawMaterials.reduce((sum, material) => sum + (material.currentStock * material.unitCost), 0);
    const criticalItems = rawMaterials.filter(m => m.currentStock <= m.minimumStock);
    const lowStockItems = rawMaterials.filter(m => m.currentStock > m.minimumStock && m.currentStock <= m.minimumStock * 1.5);
    const normalStockItems = rawMaterials.filter(m => m.currentStock > m.minimumStock * 1.5);

    return {
      totalValue,
      totalItems: rawMaterials.length,
      criticalItems,
      lowStockItems,
      normalStockItems,
      averageValue: rawMaterials.length > 0 ? totalValue / rawMaterials.length : 0
    };
  }, [rawMaterials]);

  // Relatório de Rentabilidade
  const profitabilityReport = useMemo(() => {
    const profitableProducts = productsReport.filter(p => p.hasValidCost && (p.calculation?.profitMargin || 0) > 0);
    const unprofitableProducts = productsReport.filter(p => p.hasValidCost && (p.calculation?.profitMargin || 0) <= 0);
    
    const totalRevenue = productsReport.reduce((sum, p) => sum + p.product.salePrice, 0);
    const totalProfit = productsReport.reduce((sum, p) => sum + (p.calculation?.profitMargin || 0), 0);
    const averageMargin = productsReport.length > 0 
      ? productsReport.reduce((sum, p) => sum + (p.calculation?.profitMarginPercentage || 0), 0) / productsReport.length 
      : 0;

    return {
      profitableProducts,
      unprofitableProducts,
      totalRevenue,
      totalProfit,
      averageMargin,
      profitabilityRate: productsReport.length > 0 ? (profitableProducts.length / productsReport.length) * 100 : 0
    };
  }, [productsReport]);

  const exportReport = (reportType: ReportType) => {
    // Implementação básica de exportação
    const reportData = {
      type: reportType,
      filters,
      generatedAt: new Date().toISOString(),
      data: getReportData(reportType)
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getReportData = (reportType: ReportType) => {
    switch (reportType) {
      case 'products': return productsReport;
      case 'production': return productionReport;
      case 'costs': return costsReport;
      case 'inventory': return inventoryReport;
      case 'profitability': return profitabilityReport;
      default: return {};
    }
  };

  const renderReportContent = () => {
    switch (activeReport) {
      case 'products':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total de Produtos</p>
                    <p className="text-2xl font-bold text-blue-900">{productsReport.length}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Com Custo Calculado</p>
                    <p className="text-2xl font-bold text-green-900">{productsReport.filter(p => p.hasValidCost).length}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Sem Custo</p>
                    <p className="text-2xl font-bold text-red-900">{productsReport.filter(p => !p.hasValidCost).length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Detalhes dos Produtos</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Venda</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo Unit.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margem</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productsReport.map((item) => (
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
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.hasValidCost ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.hasValidCost ? 'Completo' : 'Incompleto'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'production':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Ordens</p>
                    <p className="text-2xl font-bold text-blue-900">{productionReport.totalOrders}</p>
                  </div>
                  <Factory className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Taxa Conclusão</p>
                    <p className="text-2xl font-bold text-green-900">{productionReport.completionRate.toFixed(1)}%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Qtd. Produzida</p>
                    <p className="text-2xl font-bold text-purple-900">{productionReport.totalQuantityProduced}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Tamanho Médio</p>
                    <p className="text-2xl font-bold text-orange-900">{productionReport.averageOrderSize.toFixed(0)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ordens por Status</h3>
                <div className="space-y-4">
                  {Object.entries(productionReport.ordersByStatus).map(([status, orders]) => {
                    const statusLabels = {
                      PLANNED: { label: 'Planejadas', color: 'blue' },
                      IN_PROGRESS: { label: 'Em Produção', color: 'yellow' },
                      COMPLETED: { label: 'Concluídas', color: 'green' },
                      CANCELLED: { label: 'Canceladas', color: 'red' }
                    };
                    const config = statusLabels[status as keyof typeof statusLabels];
                    
                    return (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{config.label}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{orders.length}</span>
                          <div className={`w-3 h-3 rounded-full bg-${config.color}-500`}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ordens Recentes</h3>
                <div className="space-y-3">
                  {filteredData.filteredOrders.slice(0, 5).map((order) => {
                    const product = products.find(p => p.id === order.productId);
                    return (
                      <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product?.name || 'Produto não encontrado'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.quantity} unidades - {formatDate(order.createdAt)}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          order.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'PLANNED' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'costs':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Custo Total</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(costsReport.totalCost)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Insumos</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(costsReport.totalRawMaterialsCost)}</p>
                  </div>
                  <Package className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Mão de Obra</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(costsReport.totalLaborCost)}</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Custo Médio</p>
                    <p className="text-2xl font-bold text-orange-900">{formatCurrency(costsReport.averageCostPerProduct)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribuição de Custos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">Insumos</span>
                    <span className="text-lg font-bold text-blue-900">{formatCurrency(costsReport.totalRawMaterialsCost)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-900">Mão de Obra</span>
                    <span className="text-lg font-bold text-green-900">{formatCurrency(costsReport.totalLaborCost)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-900">Custos Indiretos</span>
                    <span className="text-lg font-bold text-purple-900">{formatCurrency(costsReport.totalIndirectCosts)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-red-900">Perdas</span>
                    <span className="text-lg font-bold text-red-900">{formatCurrency(costsReport.totalLossCost)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Custos por Categoria</h4>
                  <div className="space-y-3">
                    {Object.entries(costsReport.costsByCategory).map(([category, data]) => (
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
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Valor Total</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(inventoryReport.totalValue)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Itens</p>
                    <p className="text-2xl font-bold text-green-900">{inventoryReport.totalItems}</p>
                  </div>
                  <Package className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Estoque Crítico</p>
                    <p className="text-2xl font-bold text-red-900">{inventoryReport.criticalItems.length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Valor Médio</p>
                    <p className="text-2xl font-bold text-orange-900">{formatCurrency(inventoryReport.averageValue)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  Estoque Crítico
                </h3>
                <div className="space-y-3">
                  {inventoryReport.criticalItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">{item.currentStock} {item.unit}</p>
                        <p className="text-xs text-gray-500">Mín: {item.minimumStock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-yellow-500 mr-2" />
                  Estoque Baixo
                </h3>
                <div className="space-y-3">
                  {inventoryReport.lowStockItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-yellow-600">{item.currentStock} {item.unit}</p>
                        <p className="text-xs text-gray-500">Mín: {item.minimumStock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Estoque Normal
                </h3>
                <div className="space-y-3">
                  {inventoryReport.normalStockItems.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">{item.currentStock} {item.unit}</p>
                        <p className="text-xs text-gray-500">Mín: {item.minimumStock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'profitability':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Produtos Lucrativos</p>
                    <p className="text-2xl font-bold text-green-900">{profitabilityReport.profitableProducts.length}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700">Produtos Deficitários</p>
                    <p className="text-2xl font-bold text-red-900">{profitabilityReport.unprofitableProducts.length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Margem Média</p>
                    <p className="text-2xl font-bold text-blue-900">{profitabilityReport.averageMargin.toFixed(1)}%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Taxa Rentabilidade</p>
                    <p className="text-2xl font-bold text-purple-900">{profitabilityReport.profitabilityRate.toFixed(1)}%</p>
                  </div>
                  <PieChart className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                  Produtos Mais Lucrativos
                </h3>
                <div className="space-y-3">
                  {profitabilityReport.profitableProducts
                    .sort((a, b) => (b.calculation?.profitMargin || 0) - (a.calculation?.profitMargin || 0))
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item.product.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.product.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">{formatCurrency(item.calculation?.profitMargin || 0)}</p>
                          <p className="text-xs text-green-500">{(item.calculation?.profitMarginPercentage || 0).toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  Produtos Deficitários
                </h3>
                <div className="space-y-3">
                  {profitabilityReport.unprofitableProducts
                    .sort((a, b) => (a.calculation?.profitMargin || 0) - (b.calculation?.profitMargin || 0))
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item.product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.product.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-600">{formatCurrency(item.calculation?.profitMargin || 0)}</p>
                          <p className="text-xs text-red-500">{(item.calculation?.profitMarginPercentage || 0).toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'trends':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Análise de Tendências</h3>
              <div className="text-center py-12 text-gray-500">
                <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="font-medium">Análise de Tendências</p>
                <p className="text-sm text-gray-400 mt-1">Funcionalidade em desenvolvimento</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Relatórios</h2>
          <p className="text-gray-600">Análises detalhadas e relatórios do sistema</p>
        </div>
        
        <button
          onClick={() => exportReport(activeReport)}
          className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all flex items-center space-x-2 font-medium"
        >
          <Download className="w-5 h-5" />
          <span>Exportar</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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

      {/* Tipos de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id as ReportType)}
              className={`p-6 rounded-2xl border-2 transition-all text-left ${
                activeReport === report.id
                  ? `border-${report.color}-500 bg-${report.color}-50`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-${report.color}-500 rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.label}</h3>
                  <p className="text-sm text-gray-500">Análise detalhada</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Conteúdo do Relatório */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {renderReportContent()}
      </div>
    </div>
  );
}