import React, { useState, useEffect } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { RawMaterial, Supplier } from '../../types';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

interface RawMaterialFormProps {
  material?: RawMaterial | null;
  onClose: () => void;
}

export function RawMaterialForm({ material, onClose }: RawMaterialFormProps) {
  const { addRawMaterial, updateRawMaterial, suppliers } = useERP();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    unit: '',
    unitCost: 0,
    currentStock: 0,
    minimumStock: 0,
    wastePercentage: 0,
  });

  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        code: material.code,
        unit: material.unit,
        unitCost: material.unitCost,
        currentStock: material.currentStock,
        minimumStock: material.minimumStock,
        wastePercentage: material.wastePercentage,
      });
      setSelectedSuppliers(material.suppliers.map(s => s.id));
    }
  }, [material]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const materialData = {
        ...formData,
        suppliers: suppliers.filter(s => selectedSuppliers.includes(s.id)),
      };

      if (material) {
        await updateRawMaterial(material.id, materialData);
      } else {
        await addRawMaterial(materialData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving raw material:', error);
      alert('Erro ao salvar insumo. Tente novamente.');
    }
  };

  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
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
            {material ? 'Editar Insumo' : 'Novo Insumo'}
          </h3>
          <p className="text-sm text-gray-600">
            {material ? 'Atualize as informações do insumo' : 'Cadastre um novo insumo para produção'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Insumo</label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ex: KG, L, UN, M"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual</label>
              <input
                type="number"
                step="0.001"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
              <input
                type="number"
                step="0.001"
                value={formData.minimumStock}
                onChange={(e) => setFormData({ ...formData, minimumStock: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Percentual de Desperdício (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.wastePercentage}
                onChange={(e) => setFormData({ ...formData, wastePercentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Percentual médio de desperdício na produção"
              />
            </div>
          </div>
        </div>

        {suppliers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Fornecedores</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suppliers.map(supplier => (
                <label key={supplier.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSuppliers.includes(supplier.id)}
                    onChange={() => toggleSupplier(supplier.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                    <div className="text-xs text-gray-500">Lead time: {supplier.leadTime} dias</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

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
            <span>{material ? 'Atualizar' : 'Salvar'} Insumo</span>
          </button>
        </div>
      </form>
    </div>
  );
}