import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  Factory, 
  BarChart3, 
  TrendingUp,
  Calculator,
  Receipt,
  PieChart,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'raw-materials', label: 'Insumos', icon: Layers },
  { id: 'break-even', label: 'Ponto de Equilíbrio', icon: Calculator },
  { id: 'production', label: 'Produção', icon: Factory },
  { id: 'tax-calculator', label: 'Calculadora de Impostos', icon: Receipt },
  { id: 'financial-calculator', label: 'Calculadora Financeira', icon: DollarSign },
  { id: 'analytics', label: 'Análises', icon: TrendingUp },
  { id: 'reports', label: 'Relatórios', icon: BarChart3 },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm">
      {/* Header da Sidebar */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-black">
            Lumina Intelligence
          </h1>
          <p className="text-xs text-gray-500">Gestão de Custos</p>
        </div>
        
        {/* Nome do usuário */}
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700">
            {user?.email?.split('@')[0] || 'Usuário'}
          </span>
        </div>
      </div>
      
      {/* Menu de Navegação - Agora com scroll */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <div className="text-xs text-gray-400 text-center">
          © 2025 Lumina Intelligence
        </div>
      </div>
    </div>
  );
}