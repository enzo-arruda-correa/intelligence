import React, { useState, useEffect } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { ProductionOrder } from '../../types';
import { ArrowLeft, Save, Calendar, Package, AlertTriangle } from 'lucide-react';
import { CostCalculationService } from '../../services/costCalculationService';
import { StockService } from '../../services/stockService';

interface ProductionFormProps {
  order?: ProductionOrder | null;
  onClose: () => void;
}

export function ProductionForm({ order, onClose }: ProductionFormProps) {
  const { addProductionOrder, updateProductionOrder, products, rawMaterials } = useERP();
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    plannedDate: new Date().toISOString().slice(0, 16),
    status: 'PLANNED' as ProductionOrder['status'],
    actualCost: 0,
  });

  const [stockValidation, setStockValidation] = useState<{
    isValid: boolean;
    insufficientMaterials: string[];
    estimatedCost: number;
  }>({
    isValid: true,
    insufficientMaterials: [],
    estimatedCost: 0
  });

  useEffect(() => {
    if (order) {
      setFormData({
        productId: order.productId,
        quantity: order.quantity,
        plannedDate: new Date(order.plannedDate).toISOString().slice(0, 16),
        status: order.status,
        actualCost: order.actualCost || 0,
      });
    }
  }, [order]);

  useEffect(() => {
    if (formData.productId && formData.quantity > 0) {
      validateProduction();
    }
  }, [formData.productId, formData.quantity]);

  const validateProduction = () => {
    const product = products.find(p => p.id === formData.productId);
    if (!product || !product.bom) {
      setStockValidation({
        isValid: false,
        insufficientMaterials: ['Produto sem ficha técnica'],
        estimatedCost: 0
      });
      return;
    }

    try {
      // Calcular consumo de materiais
      const consumption = StockService.calculateStockConsumption(product.bom, formData.quantity);
      const insufficientMaterials: string[] = [];

      // Verificar disponibilidade de estoque
      consumption.forEach((requiredQuantity, materialId) => {
        const material = rawMaterials.find(rm => rm.id === materialId);
        if (!material || material.currentStock < requiredQuantity) {
          insufficientMaterials.push(material?.name || materialId);
        }
      });

      // Calcular custo estimado
      const calculation = CostCalculationService.calculateProductCost(product);
      const estimatedCost = calculation.totalUnitCost * formData.quantity;

      setStockValidation({
        isValid: insufficientMaterials.length === 0,
        insufficientMaterials,
        estimatedCost
      });
    } catch (error) {
      setStockValidation({
        isValid: false,
        insufficientMaterials: ['Erro ao calcular custos'],
        estimatedCost: 0
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stockValidation.isValid && formData.status !== 'CANCELLED') {
      alert('Não é possível criar a ordem de produção devido à falta de materiais em estoque.');
      return;
    }

    const orderData = {
      ...formData,
      plannedDate: new Date(formData.plannedDate),
      actualCost: formData.actualCost > 0 ? formData.actualCost : undefined,
    };

    if (order) {
      updateProductionOrder(order.id, orderData);
    } else {
      addProductionOrder(orderData);
    }

    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const selectedProduct = products.find(p => p.id === formData.productId);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {order ? 'Editar Ordem de Produção' : 'Nova Ordem de Produção'}
          </h3>
          <p className="text-sm text-gray-600">
            {order ? 'Atualize as informações da ordem' : 'Crie uma nova ordem de produção'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações básicas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Informações da Ordem</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produto</label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione um produto</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Planejada</label>
              <input
                type="datetime-local"
                value={formData.plannedDate}
                onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductionOrder['status'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PLANNED">Planejado</option>
                <option value="IN_PROGRESS">Em Produção</option>
                <option value="COMPLETED">Concluído</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
            
            {(formData.status === 'COMPLETED' || formData.status === 'IN_PROGRESS') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Custo Real (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.actualCost}
                  onChange={(e) => setFormData({ ...formData, actualCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Custo real da produção"
                />
              </div>
            )}
          </div>
        </div>

        {/* Validação de Estoque */}
        {formData.productId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Validação de Produção
            </h4>
            
            <div className="space-y-4">
              {/* Custo Estimado */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Custo Estimado Total:</span>
                  <span className="text-lg font-bold text-blue-900">
                    {formatCurrency(stockValidation.estimatedCost)}
                  </span>
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Custo unitário: {stockValidation.estimatedCost > 0 ? formatCurrency(stockValidation.estimatedCost / formData.quantity) : 'N/A'}
                </div>
              </div>

              {/* Status de Validação */}
              {stockValidation.isValid ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-900">Produção Viável</p>
                      <p className="text-xs text-green-700">Todos os materiais estão disponíveis em estoque</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900">Materiais Insuficientes</p>
                      <p className="text-xs text-red-700 mb-2">Os seguintes materiais não estão disponíveis:</p>
                      <ul className="text-xs text-red-700 space-y-1">
                        {stockValidation.insufficientMaterials.map((material, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                            {material}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Informações do Produto */}
              {selectedProduct && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">Informações do Produto</h5>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">Tempo de Produção:</span>
                      <div className="font-medium">{selectedProduct.productionTime} min/un</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Tempo Total:</span>
                      <div className="font-medium">{selectedProduct.productionTime * formData.quantity} min</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Perda Média:</span>
                      <div className="font-medium">{selectedProduct.averageLossPercentage}%</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Preço de Venda:</span>
                      <div className="font-medium">{formatCurrency(selectedProduct.salePrice)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!stockValidation.isValid && formData.status !== 'CANCELLED'}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{order ? 'Atualizar' : 'Criar'} Ordem</span>
          </button>
        </div>
      </form>
    </div>
  );
}