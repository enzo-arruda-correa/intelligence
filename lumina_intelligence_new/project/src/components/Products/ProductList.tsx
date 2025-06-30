import React, { useState } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { ProductForm } from './ProductForm';
import { CostCalculationService } from '../../services/costCalculationService';
import { Plus, Edit, Trash2, Calculator, Eye } from 'lucide-react';
import { Product } from '../../types';

export function ProductList() {
  const { products, deleteProduct } = useERP();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const calculateProductCost = (product: Product) => {
    try {
      return CostCalculationService.calculateProductCost(product);
    } catch {
      return null;
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <ProductForm 
            product={editingProduct} 
            onClose={handleCloseForm}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Produtos Cadastrados</h3>
          <p className="text-gray-600">Gerencie seus produtos e suas fichas técnicas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center space-x-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Produto</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Produto
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Categoria
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Preço de Venda
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Custo Unitário
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Margem
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {products.map((product) => {
                const calculation = calculateProductCost(product);
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(product.salePrice)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {calculation ? formatCurrency(calculation.totalUnitCost) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {calculation ? (
                        <span className={`text-sm font-semibold ${
                          calculation.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {calculation.profitMarginPercentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {product.bom ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Sem BOM
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-all"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {products.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum produto cadastrado</h3>
            <p className="text-gray-500 mb-6">Comece criando seu primeiro produto</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-medium"
            >
              Criar Produto
            </button>
          </div>
        )}
      </div>

      {/* Modal de detalhes do produto */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Detalhes do Produto</h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Nome</label>
                  <p className="text-gray-900 mt-1">{selectedProduct.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Código</label>
                  <p className="text-gray-900 mt-1">{selectedProduct.code}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Categoria</label>
                  <p className="text-gray-900 mt-1">{selectedProduct.category}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Preço de Venda</label>
                  <p className="text-gray-900 mt-1">{formatCurrency(selectedProduct.salePrice)}</p>
                </div>
              </div>
              
              {(() => {
                const calculation = calculateProductCost(selectedProduct);
                if (!calculation) return null;
                
                return (
                  <div className="border-t pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Análise de Custos</h4>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Custo de Insumos:</span>
                          <span className="font-medium">{formatCurrency(calculation.rawMaterialsCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Custo de Mão de Obra:</span>
                          <span className="font-medium">{formatCurrency(calculation.laborCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Custos Indiretos:</span>
                          <span className="font-medium">{formatCurrency(calculation.indirectCosts)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Custo de Perdas:</span>
                          <span className="font-medium">{formatCurrency(calculation.lossCost)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 col-span-2">
                          <span className="text-gray-900 font-semibold">Custo Total:</span>
                          <span className="font-bold">{formatCurrency(calculation.totalUnitCost)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 col-span-2">
                          <span className="text-gray-900 font-semibold">Margem de Lucro:</span>
                          <span className={`font-bold ${
                            calculation.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(calculation.profitMargin)} ({calculation.profitMarginPercentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}