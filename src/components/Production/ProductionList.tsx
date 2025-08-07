import React, { useState } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { ProductionForm } from './ProductionForm';
import { ProductionDetails } from './ProductionDetails';
import { Plus, Eye, Edit, Play, Pause, CheckCircle, XCircle, Clock, Factory } from 'lucide-react';
import { ProductionOrder } from '../../types';

export function ProductionList() {
  const { productionOrders, products, updateProductionOrder } = useERP();
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusConfig = (status: ProductionOrder['status']) => {
    const configs = {
      PLANNED: { 
        label: 'Planejado', 
        color: 'text-blue-600', 
        bg: 'bg-blue-100',
        icon: Clock
      },
      IN_PROGRESS: { 
        label: 'Em Produção', 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-100',
        icon: Play
      },
      COMPLETED: { 
        label: 'Concluído', 
        color: 'text-green-600', 
        bg: 'bg-green-100',
        icon: CheckCircle
      },
      CANCELLED: { 
        label: 'Cancelado', 
        color: 'text-red-600', 
        bg: 'bg-red-100',
        icon: XCircle
      }
    };
    return configs[status];
  };

  const handleStatusChange = (orderId: string, newStatus: ProductionOrder['status']) => {
    const updateData: Partial<ProductionOrder> = { status: newStatus };
    
    if (newStatus === 'COMPLETED') {
      updateData.completedDate = new Date();
    }
    
    updateProductionOrder(orderId, updateData);
  };

  const handleEdit = (order: ProductionOrder) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingOrder(null);
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Produto não encontrado';
  };

  const getProductCode = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.code : '';
  };

  // Estatísticas rápidas
  const stats = {
    total: productionOrders.length,
    planned: productionOrders.filter(o => o.status === 'PLANNED').length,
    inProgress: productionOrders.filter(o => o.status === 'IN_PROGRESS').length,
    completed: productionOrders.filter(o => o.status === 'COMPLETED').length,
    cancelled: productionOrders.filter(o => o.status === 'CANCELLED').length
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <ProductionForm 
            order={editingOrder} 
            onClose={handleCloseForm}
          />
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <ProductionDetails 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)}
            onEdit={() => {
              setEditingOrder(selectedOrder);
              setSelectedOrder(null);
              setShowForm(true);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Ordens de Produção</h3>
          <p className="text-gray-600">Gerencie e acompanhe suas ordens de produção</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center space-x-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Ordem</span>
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Factory className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Planejadas</p>
              <p className="text-2xl font-bold text-blue-600">{stats.planned}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Produção</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            </div>
            <Play className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluídas</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Canceladas</p>
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Lista de Ordens */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Ordem
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Produto
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Quantidade
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Data Planejada
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Custo Real
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {productionOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">#{order.id.slice(-6).toUpperCase()}</div>
                      <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{getProductName(order.productId)}</div>
                        <div className="text-sm text-gray-500">{getProductCode(order.productId)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {order.quantity} un
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(order.plannedDate)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.actualCost ? formatCurrency(order.actualCost) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-all"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {order.status === 'PLANNED' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'IN_PROGRESS')}
                            className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-all"
                            title="Iniciar produção"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        
                        {order.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-all"
                            title="Finalizar produção"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {(order.status === 'PLANNED' || order.status === 'IN_PROGRESS') && (
                          <button
                            onClick={() => handleEdit(order)}
                            className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {productionOrders.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Factory className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma ordem de produção</h3>
            <p className="text-gray-500 mb-6">Comece criando sua primeira ordem de produção</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-medium"
            >
              Criar Ordem
            </button>
          </div>
        )}
      </div>
    </div>
  );
}