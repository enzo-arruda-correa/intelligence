import React, { useState, Suspense, lazy, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginForm } from './components/Auth/LoginForm'
import { Sidebar } from './components/Layout/Sidebar'
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })) )
const SalesAnalysis = lazy(() => import('./components/Sales/SalesAnalysis').then(m => ({ default: m.SalesAnalysis })) )
const ProductsAnalysis = lazy(() => import('./components/Products/ProductsAnalysis').then(m => ({ default: m.ProductsAnalysis })) )
const InvestmentCalculator = lazy(() => import('./components/Investments/InvestmentCalculator').then(m => ({ default: m.InvestmentCalculator })) )
const MarketingAnalysis = lazy(() => import('./components/Marketing/MarketingAnalysis').then(m => ({ default: m.MarketingAnalysis })) )

function App() {
  const { user, loading } = useAuth()
  console.log('App: render, loading =', loading, 'user =', user)
  const [activeMenu, setActiveMenu] = useState('dashboard')

  // Prefetch do Dashboard para reduzir TTFB percebido
  useEffect(() => {
    void import('./components/Dashboard/Dashboard')
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />
      case 'sales':
        return <SalesAnalysis />
      case 'products':
        return <ProductsAnalysis />
      case 'investments':
        return <InvestmentCalculator />
      case 'marketing':
        return <MarketingAnalysis />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
          <Suspense fallback={
            <div className="w-full h-64 flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          }>
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default App