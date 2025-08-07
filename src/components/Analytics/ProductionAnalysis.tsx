import React, { useMemo } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { Factory, Clock, CheckCircle, AlertCircle, TrendingUp, Calendar } from 'lucide-react';

export function ProductionAnalysis() {
  const { productionOrders, products } = useERP();

  const productionData = useMemo(() => {
    // Análise por status
    const ordersByStatus = {
      PLANNED: productionOrders.filter(o => o.status === 'PLANNED'),
      IN_PROGRESS: productionOrders.filter(o => o.status === 'IN_PROGRESS'),
      COMPLETED: productionOrders.filter(o => o.status === 'COMPLETED'),
      CANCELLED: productionOrders.filter(o => o.status === 'CANCELLED')
    };

    // Análise de tempo de produção
    const completedOrders = ordersByStatus.COMPLETED;
    const productionTimes = completedOrders.map(order => {
      if (order.completedDate) {
        const startDate = new Date(order.createdAt);
        const endDate = new Date(order.completedDate);
        const timeDiff = endDate.getTime() - startDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return { order, days: daysDiff };
      }
      return null;
    }).filter(Boolean) as Array<{ order: any; days: number }>;

    const averageProductionTime = productionTimes.length > 0 
      ? productionTimes.reduce((sum, item) => sum + item.days, 0) / productionTimes.length
      : 0;

    // Análise de produtividade por produto
    const productivityByProduct = products.map(product => {
      const productOrders = productionOrders.filter(o => o.productId === product.id);
      const completedProductOrders = productOrders.filter(o => o.status === 'COMPLETED');
      const totalQuantityProduced = completedProductOrders.reduce((sum, order) => sum + order.quantity, 0);
      
      return {
        product,
        totalOrders: productOrders.length,
        completedOrders: completedProductOrders.length,
        totalQuantityProduced,
        completionRate: productOrders.length > 0 ? (completedProductOrders.length / productOrders.length) * 100 : 0
      };
    }).filter(item => item.totalOrders > 0)
      .sort((a, b) => b.totalQuantityProduced - a.totalQuantityProduced);

    // Análise mensal (últimos 6 meses)
    const monthlyAnalysis = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthOrders = productionOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const orderMonthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        return orderMonthKey === monthKey;
      });

      const completedInMonth = monthOrders.filter(o => o.status === 'COMPLETED');
      
      monthlyAnalysis.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        totalOrders: monthOrders.length,
        completedOrders: completedInMonth.length,
        completionRate: monthOrders.length > 0 ? (completedInMonth.length / monthOrders.length) * 100 : 0,
        totalQuantity: completedInMonth.reduce((sum, order) => sum + order.quantity, 0)
      });
    }

    // Eficiência de produção
    const totalPlannedTime = completedOrders.reduce((sum, order) => {
      const product = products.find(p => p.id === order.productId);
      return sum + (product ? product.productionTime * order.quantity : 0);
    }, 0);

    const efficiency = completedOrders.length > 0 ? 
      (totalPlannedTime / (averageProductionTime * completedOrders.length * 24 * 60)) * 100 : 0;

    return {
      ordersByStatus,
      productionTimes,
      averageProductionTime,
      productivityByProduct,
      monthlyAnalysis,
      efficiency,
      metrics: {
        totalOrders: productionOrders.length,
        completionRate: productionOrders.length > 0 ? (completedOrders.length / productionOrders.length) * 100 : 0,
        averageOrderSize: completedOrders.length > 0 ? 
          completedOrders.reduce((sum, order) => sum + order.quantity, 0) / completedOrders.length : 0,
        totalProduced: completedOrders.reduce((sum, order) => sum + order.quantity, 0)
      }
    };
  }, [productionOrders, products]);

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PLANNED: 'text-blue-600 bg-blue-100',
      IN_PROGRESS: 'text-yellow-600 bg-yellow-100',
      COMPLETED: 'text-green-600 bg-green-100',
      CANCELLED: 'text-red-600 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-8">
      {/* Métricas Principais de Produção */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total de Ordens</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {productionData.metrics.totalOrders}
              </p>
            </div>
            <Factory className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Taxa de Conclusão</p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {productionData.metrics.completionRate.toFixed(1)}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Tempo Médio</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {productionData.averageProductionTime.toFixed(1)} dias
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Total Produzido</p>
              <p className="text-2xl font-bold text-orange-900 mt-2">
                {formatNumber(productionData.metrics.totalProduced)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Status das Ordens */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Status das Ordens de Produção</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(productionData.ordersByStatus).map(([status, orders]) => {
            const statusLabels = {
              PLANNED: 'Planejadas',
              IN_PROGRESS: 'Em Produção',
              COMPLETED: 'Concluídas',
              CANCELLED: 'Canceladas'
            };
            
            return (
              <div key={status} className="text-center">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(status)} mb-3`}>
                  {statusLabels[status as keyof typeof statusLabels]}
                </div>
                <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {productionData.metrics.totalOrders > 0 
                    ? `${((orders.length / productionData.metrics.totalOrders) * 100).toFixed(1)}%`
                    : '0%'
                  } do total
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Análise Mensal */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Tendência Mensal (Últimos 6 Meses)
        </h3>
        <div className="space-y-4">
          {productionData.monthlyAnalysis.map((month, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                  {month.month.split(' ')[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{month.month}</p>
                  <p className="text-xs text-gray-500">
                    {month.completedOrders} de {month.totalOrders} ordens concluídas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatNumber(month.totalQuantity)} un</p>
                <p className="text-xs text-gray-500">produzidas</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${month.completionRate >= 80 ? 'text-green-600' : month.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {month.completionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">conclusão</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Produtividade por Produto */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Produtividade por Produto</h3>
        <div className="space-y-4">
          {productionData.productivityByProduct.slice(0, 10).map((item, index) => (
            <div key={item.product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                  <p className="text-xs text-gray-500">{item.product.code}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.totalOrders}</p>
                  <p className="text-xs text-gray-500">ordens</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-600">{formatNumber(item.totalQuantityProduced)}</p>
                  <p className="text-xs text-gray-500">produzidas</p>
                </div>
                <div>
                  <p className={`text-sm font-bold ${item.completionRate >= 80 ? 'text-green-600' : item.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {item.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500">conclusão</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Análise de Tempo de Produção */}
      {productionData.productionTimes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Análise de Tempo de Produção</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-xl p-6 text-center">
              <p className="text-sm font-medium text-blue-700 mb-2">Tempo Médio</p>
              <p className="text-3xl font-bold text-blue-900">
                {productionData.averageProductionTime.toFixed(1)} dias
              </p>
            </div>
            
            <div className="bg-green-50 rounded-xl p-6 text-center">
              <p className="text-sm font-medium text-green-700 mb-2">Menor Tempo</p>
              <p className="text-3xl font-bold text-green-900">
                {Math.min(...productionData.productionTimes.map(t => t.days))} dias
              </p>
            </div>
            
            <div className="bg-orange-50 rounded-xl p-6 text-center">
              <p className="text-sm font-medium text-orange-700 mb-2">Maior Tempo</p>
              <p className="text-3xl font-bold text-orange-900">
                {Math.max(...productionData.productionTimes.map(t => t.days))} dias
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Tempos</h4>
            <div className="space-y-2">
              {[
                { range: '1-3 dias', count: productionData.productionTimes.filter(t => t.days <= 3).length },
                { range: '4-7 dias', count: productionData.productionTimes.filter(t => t.days > 3 && t.days <= 7).length },
                { range: '8-15 dias', count: productionData.productionTimes.filter(t => t.days > 7 && t.days <= 15).length },
                { range: '16+ dias', count: productionData.productionTimes.filter(t => t.days > 15).length }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.range}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ 
                          width: `${productionData.productionTimes.length > 0 ? (item.count / productionData.productionTimes.length) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}