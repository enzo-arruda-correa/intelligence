import React from 'react';
import { RawMaterial } from '../../types';
import { AlertTriangle, Package } from 'lucide-react';

interface StockAlertsProps {
  rawMaterials: RawMaterial[];
}

export function StockAlerts({ rawMaterials }: StockAlertsProps) {
  const criticalItems = rawMaterials.filter(material => 
    material.currentStock <= material.minimumStock
  );

  const lowStockItems = rawMaterials.filter(material => 
    material.currentStock > material.minimumStock && 
    material.currentStock <= material.minimumStock * 1.5
  );

  return (
    <div className="h-full">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
          Alertas de Estoque
        </h3>
      </div>
      
      <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
        {criticalItems.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-600 mb-3">Estoque Crítico</h4>
            <div className="space-y-3">
              {criticalItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-900">{item.name}</p>
                      <p className="text-xs text-red-600">{item.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-900">{item.currentStock} {item.unit}</p>
                    <p className="text-xs text-red-600">Mín: {item.minimumStock}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lowStockItems.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-yellow-600 mb-3">Estoque Baixo</h4>
            <div className="space-y-3">
              {lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-yellow-900">{item.name}</p>
                      <p className="text-xs text-yellow-600">{item.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-900">{item.currentStock} {item.unit}</p>
                    <p className="text-xs text-yellow-600">Mín: {item.minimumStock}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {criticalItems.length === 0 && lowStockItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-medium">Todos os estoques estão em níveis adequados</p>
            <p className="text-sm text-gray-400 mt-1">Nenhum alerta no momento</p>
          </div>
        )}
      </div>
    </div>
  );
}