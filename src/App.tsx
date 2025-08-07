import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ERPProvider } from './contexts/ERPContext';
import { AuthForm } from './components/Auth/AuthForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProductList } from './components/Products/ProductList';
import { RawMaterialList } from './components/RawMaterials/RawMaterialList';
import { BreakEvenAnalysis } from './components/Analytics/BreakEvenAnalysis';
import { ProductionList } from './components/Production/ProductionList';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { TaxCalculator } from './components/TaxCalculator/TaxCalculator';
import { FinancialCalculator } from './components/FinancialCalculator/FinancialCalculator';
import { ReportsModule } from './components/Reports/ReportsModule';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>
            <Dashboard />
          </div>
        );
      case 'products':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Produtos</h2>
            <ProductList />
          </div>
        );
      case 'raw-materials':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Insumos</h2>
            <RawMaterialList />
          </div>
        );
      case 'break-even':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Ponto de Equilíbrio</h2>
            <BreakEvenAnalysis />
          </div>
        );
      case 'production':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Produção</h2>
            <ProductionList />
          </div>
        );
      case 'tax-calculator':
        return (
          <div className="p-8">
            <TaxCalculator />
          </div>
        );
      case 'financial-calculator':
        return (
          <div className="p-8">
            <FinancialCalculator />
          </div>
        );
      case 'analytics':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Análises</h2>
            <AnalyticsDashboard />
          </div>
        );
      case 'reports':
        return (
          <div className="p-8">
            <ReportsModule />
          </div>
        );
      default:
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>
            <Dashboard />
          </div>
        );
    }
  };

  return (
    <ERPProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </ERPProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;