import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginForm } from './components/Auth/LoginForm'
import { Sidebar } from './components/Layout/Sidebar'
import { Header } from './components/Layout/Header'
import { Dashboard } from './components/Dashboard/Dashboard'
import { SalesAnalysis } from './components/Sales/SalesAnalysis'
import { ProductsAnalysis } from './components/Products/ProductsAnalysis'
import { InvestmentCalculator } from './components/Investments/InvestmentCalculator'
import { MarketingAnalysis } from './components/Marketing/MarketingAnalysis'

function App() {
  const { user, loading } = useAuth()
  const [activeMenu, setActiveMenu] = useState('dashboard')

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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default App