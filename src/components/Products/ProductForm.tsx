import React, { useState, useEffect } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { Product, BillOfMaterials, BOMItem, ProductionStep } from '../../types';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const { addProduct, updateProduct, rawMaterials } = useERP();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    unit: '',
    category: '',
    salePrice: 0,
    costPrice: 0,
    allocatedFixedCost: 0,
    productionTime: 0,
    averageLossPercentage: 0,
    status: 'active' as 'active' | 'inactive',
  });

  const [bomItems, setBomItems] = useState<Omit<BOMItem, 'rawMaterial' | 'wasteAdjustedQuantity'>[]>([]);
  const [productionSteps, setProductionSteps] = useState<Omit<ProductionStep, 'id'>[]>([]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        code: product.code,
        description: product.description || '',
        unit: product.unit,
        category: product.category,
        salePrice: product.salePrice,
        costPrice: product.costPrice,
        allocatedFixedCost: product.allocatedFixedCost,
        productionTime: product.productionTime,
        averageLossPercentage: product.averageLossPercentage,
        status: product.status,
      });

      if (product.bom) {
        setBomItems(product.bom.items.map(item => ({
          rawMaterialId: item.rawMaterialId,
          quantity: item.quantity,
          unit: item.unit,
        })));
        setProductionSteps(product.bom.productionSteps.map(step => ({
          name: step.name,
          description: step.description,
          timeMinutes: step.timeMinutes,
          laborCostPerHour: step.laborCostPerHour,
          indirectCosts: step.indirectCosts,
          averageLoss: step.averageLoss,
        })));
      }
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const bom: BillOfMaterials = {
        id: product?.bom?.id || Math.random().toString(36).substr(2, 9),
        productId: product?.id || '',
        items: bomItems.map(item => {
          const rawMaterial = rawMaterials.find(rm => rm.id === item.rawMaterialId)!;
          return {
            ...item,
            rawMaterial,
            wasteAdjustedQuantity: item.quantity * (1 + rawMaterial.wastePercentage / 100),
          };
        }),
        productionSteps: productionSteps.map(step => ({
          ...step,
          id: Math.random().toString(36).substr(2, 9),
        })),
        totalProductionTime: productionSteps.reduce((total, step) => total + step.timeMinutes, 0),
        createdAt: product?.bom?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      const productData = {
        ...formData,
        bom: bomItems.length > 0 || productionSteps.length > 0 ? bom : undefined,
      };

      if (product) {
        await updateProduct(product.id, productData);
      } else {
        await addProduct(productData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erro ao salvar produto. Tente novamente.');
    }
  };

  const addBomItem = () => {
    setBomItems([...bomItems, { rawMaterialId: '', quantity: 0, unit: '' }]);
  };

  const removeBomItem = (index: number) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  const updateBomItem = (index: number, field: string, value: any) => {
    const updated = [...bomItems];
    updated[index] = { ...updated[index], [field]: value };
    setBomItems(updated);
  };

  const addProductionStep = () => {
    setProductionSteps([...productionSteps, {
      name: '',
      description: '',
      timeMinutes: 0,
      laborCostPerHour: 0,
      indirectCosts: 0,
      averageLoss: 0,
    }]);
  };

  const removeProductionStep = (index: number) => {
    setProductionSteps(productionSteps.filter((_, i) => i !== index));
  };

  const updateProductionStep = (index: number, field: string, value: any) => {
    const updated = [...productionSteps];
    updated[index] = { ...updated[index], [field]: value };
    setProductionSteps(updated);
  };

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
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h3>
          <p className="text-sm text-gray-600">
            {product ? 'Atualize as informações do produto' : 'Cadastre um novo produto com sua ficha técnica'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações básicas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Descrição detalhada do produto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ex: UN, KG, L"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo Fixo Alocado (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.allocatedFixedCost}
                onChange={(e) => setFormData({ ...formData, allocatedFixedCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de Produção (min)</label>
              <input
                type="number"
                value={formData.productionTime}
                onChange={(e) => setFormData({ ...formData, productionTime: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perda Média (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.averageLossPercentage}
                onChange={(e) => setFormData({ ...formData, averageLossPercentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Materiais (BOM) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900">Lista de Materiais (BOM)</h4>
            <button
              type="button"
              onClick={addBomItem}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Material</span>
            </button>
          </div>
          
          <div className="space-y-3">
            {bomItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <select
                  value={item.rawMaterialId}
                  onChange={(e) => updateBomItem(index, 'rawMaterialId', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione um insumo</option>
                  {rawMaterials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.code})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.001"
                  placeholder="Quantidade"
                  value={item.quantity}
                  onChange={(e) => updateBomItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  placeholder="Unidade"
                  value={item.unit}
                  onChange={(e) => updateBomItem(index, 'unit', e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeBomItem(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Etapas de Produção */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900">Etapas de Produção</h4>
            <button
              type="button"
              onClick={addProductionStep}
              className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Etapa</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {productionSteps.map((step, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Nome da etapa"
                    value={step.name}
                    onChange={(e) => updateProductionStep(index, 'name', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Descrição"
                    value={step.description}
                    onChange={(e) => updateProductionStep(index, 'description', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tempo (min)</label>
                    <input
                      type="number"
                      value={step.timeMinutes}
                      onChange={(e) => updateProductionStep(index, 'timeMinutes', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Custo/Hora (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={step.laborCostPerHour}
                      onChange={(e) => updateProductionStep(index, 'laborCostPerHour', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Custos Indiretos (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={step.indirectCosts}
                      onChange={(e) => updateProductionStep(index, 'indirectCosts', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Perda (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={step.averageLoss}
                      onChange={(e) => updateProductionStep(index, 'averageLoss', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    onClick={() => removeProductionStep(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

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
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{product ? 'Atualizar' : 'Salvar'} Produto</span>
          </button>
        </div>
      </form>
    </div>
  );
}