import React from 'react';
import { useERP } from '../../contexts/ERPContext';
import { ProductionOrder } from '../../types';
import { ArrowLeft, Edit, Calendar, Package, Clock, DollarSign, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { CostCalculationService } from '../../services/costCalculationService';
import { StockService } from '../../services/stockService';

interface ProductionDetailsProps {
  order: ProductionOrder;
  onClose: () => void;
  onEdit: () => void;
}

export function ProductionDetails({ order, onClose, onEdit }: ProductionDetailsProps) {
  const { products, rawMaterials } = useERP();

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

  const product = products.find(p => p.id === order.productId);
  
  // Calcular informações de produção
  const productionInfo = React.useMemo(() => {
    if (!product || !product.bom) return null;

    try {
      const calculation = CostCalculationService.calculateProductCost(product);
      const consumption = StockService.calculateStockConsumption(product.bom, order.quantity);
      const insufficientMaterials: string[] = [];

      consumption.forEach((requiredQuantity, materialId) => {
        const material = rawMaterials.find(rm => rm.id === materialId);
        if (!material || material.currentStock < requiredQuantity) {
          insufficientMaterials.push(material?.name || materialId);
        }
      });

      return {
        calculation,
        consumption,
        insufficientMaterials,
        estimatedCost: calculation.totalUnitCost * order.quantity,
        totalProductionTime: product.productionTime * order.quantity,
        estimatedRevenue: product.salePrice * order.quantity
      };
    } catch {
      return null;
    }
  }, [product, order.quantity, rawMaterials]);

  const getStatusConfig = (status: ProductionOrder['status']) => {
    const configs = {
      PLANNED: { 
        label: 'Planejado', 
        color: 'text-blue-600', 
        bg: 'bg-blue-100',
        description: 'Ordem criada e aguardando início da produção'
      },
      IN_PROGRESS: { 
        label: 'Em Produção', 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-100',
        description: 'Produção em andamento'
      },
      COMPLETED: { 
        label: 'Concluído', 
        color: 'text-green-600', 
        bg: 'bg-green-100',
        description: 'Produção finalizada com sucesso'
      },
      CANCELLED: { 
        label: 'Cancelado', 
        color: 'text-red-600', 
        bg: 'bg-red-100',
        description: 'Ordem cancelada'
      }
    };
    return configs[status];
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Ordem #{order.id.slice(-6).toUpperCase()}
            </h3>
            <p className="text-sm text-gray-600">
              Detalhes da ordem de produção
            </p>
          </div>
        </div>
        
        {(order.status === 'PLANNED' || order.status === 'IN_PROGRESS') && (
          <button
            onClick={onEdit}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Editar</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status e Informações Básicas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Informações da Ordem</h4>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Produto</p>
                    <p className="text-sm text-gray-600">{product?.name || 'Produto não encontrado'}</p>
                    <p className="text-xs text-gray-500">{product?.code}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Quantidade</p>
                    <p className="text-sm text-gray-600">{order.quantity} unidades</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Data Planejada</p>
                    <p className="text-sm text-gray-600">{formatDate(order.plannedDate)}</p>
                  </div>
                </div>
                
                {order.completedDate && (
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Data de Conclusão</p>
                      <p className="text-sm text-gray-600">{formatDate(order.completedDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{statusConfig.description}</p>
            </div>
          </div>

          {/* Consumo de Materiais */}
          {productionInfo && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Consumo de Materiais</h4>
              
              {productionInfo.insufficientMaterials.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-sm font-medium text-red-900">Materiais Insuficientes</p>
                  </div>
                  <ul className="mt-2 text-sm text-red-700 space-y-1">
                    {productionInfo.insufficientMaterials.map((material, index) => (
                      <li key={index}>• {material}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="space-y-3">
                {Array.from(productionInfo.consumption.entries()).map(([materialId, quantity]) => {
                  const material = rawMaterials.find(rm => rm.id === materialId);
                  if (!material) return null;
                  
                  const isInsufficient = material.currentStock < quantity;
                  
                  return (
                    <div key={materialId} className={`flex items-center justify-between p-3 rounded-lg ${isInsufficient ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{material.name}</p>
                        <p className="text-xs text-gray-500">{material.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {quantity.toFixed(3)} {material.unit}
                        </p>
                        <p className={`text-xs ${isInsufficient ? 'text-red-600' : 'text-gray-500'}`}>
                          Estoque: {material.currentStock} {material.unit}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Resumo Financeiro e Tempo */}
        <div className="space-y-6">
          {/* Resumo Financeiro */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Resumo Financeiro
            </h4>
            
            {productionInfo && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Custo Estimado:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(productionInfo.estimatedCost)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Receita Estimada:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(productionInfo.estimatedRevenue)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-sm font-medium text-gray-900">Lucro Estimado:</span>
                  <span className={`text-sm font-bold ${
                    (productionInfo.estimatedRevenue - productionInfo.estimatedCost) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatCurrency(productionInfo.estimatedRevenue - productionInfo.estimatedCost)}
                  </span>
                </div>
                
                {order.actualCost && (
                  <>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Custo Real:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.actualCost)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-medium text-gray-900">Lucro Real:</span>
                        <span className={`text-sm font-bold ${
                          (productionInfo.estimatedRevenue - order.actualCost) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formatCurrency(productionInfo.estimatedRevenue - order.actualCost)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Informações de Tempo */}
          {productionInfo && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Tempo de Produção
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tempo por Unidade:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {product?.productionTime} min
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tempo Total:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.floor(productionInfo.totalProductionTime / 60)}h {productionInfo.totalProductionTime % 60}min
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Perda Estimada:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {product?.averageLossPercentage}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Histórico */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Histórico</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Ordem Criada</p>
                  <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
              </div>
              
              {order.status !== 'PLANNED' && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Produção Iniciada</p>
                    <p className="text-xs text-gray-500">Status alterado para Em Produção</p>
                  </div>
                </div>
              )}
              
              {order.completedDate && (
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Produção Concluída</p>
                    <p className="text-xs text-gray-500">{formatDate(order.completedDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}