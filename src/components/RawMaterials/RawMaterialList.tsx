import React, { useState } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { RawMaterialForm } from './RawMaterialForm';
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { RawMaterial } from '../../types';

export function RawMaterialList() {
  const { rawMaterials, deleteRawMaterial } = useERP();
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este insumo?')) {
      deleteRawMaterial(id);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMaterial(null);
  };

  const getStockStatus = (material: RawMaterial) => {
    if (material.currentStock <= material.minimumStock) {
      return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100' };
    }
    if (material.currentStock <= material.minimumStock * 1.5) {
      return { status: 'low', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <RawMaterialForm 
            material={editingMaterial} 
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
          <h3 className="text-xl font-semibold text-gray-900">Insumos Cadastrados</h3>
          <p className="text-gray-600">Gerencie seus insumos e controle de estoque</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center space-x-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Insumo</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Insumo
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Custo Unitário
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Estoque Atual
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Estoque Mínimo
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Desperdício
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rawMaterials.map((material) => {
                const stockStatus = getStockStatus(material);
                return (
                  <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{material.name}</div>
                        <div className="text-sm text-gray-500">{material.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(material.unitCost)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {material.currentStock} {material.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {material.minimumStock} {material.unit}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                        {stockStatus.status === 'critical' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {stockStatus.status === 'critical' ? 'Crítico' : 
                         stockStatus.status === 'low' ? 'Baixo' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {material.wastePercentage}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(material)}
                          className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
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
        
        {rawMaterials.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum insumo cadastrado</h3>
            <p className="text-gray-500 mb-6">Comece criando seu primeiro insumo</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all font-medium"
            >
              Criar Insumo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}