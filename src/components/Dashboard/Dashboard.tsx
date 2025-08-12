import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useRealtime } from '../../hooks/useRealtime'

interface DashboardStats {
  totalSales: number
  totalRevenue: number
  totalProducts: number
  totalCustomers: number
  salesGrowth: number
  revenueGrowth: number
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    salesGrowth: 0,
    revenueGrowth: 0
  })
  const [salesData, setSalesData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Setup realtime subscriptions
  useRealtime({
    table: 'sales',
    onInsert: () => fetchDashboardData(),
    onUpdate: () => fetchDashboardData(),
    onDelete: () => fetchDashboardData()
  })

  useRealtime({
    table: 'products',
    onInsert: () => fetchDashboardData(),
    onUpdate: () => fetchDashboardData(),
    onDelete: () => fetchDashboardData()
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch sales data with proper status filtering
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(100)

      if (salesError) {
        console.error('Error fetching sales:', salesError)
      }

      // Fetch products count  
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      if (productsError) {
        console.error('Error fetching products count:', productsError)
      }

      // Fetch customers count
      const { count: customersCount, error: customersError } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })

      if (customersError) {
        console.error('Error fetching customers count:', customersError)
      }

      // Calculate stats
      const completedSales = sales?.filter(sale => sale.status === 'completed') || []
      const totalSales = completedSales.length
      const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.total_amount, 0)

      // Calculate growth (mock calculation - in real scenario, compare with previous period)
      const salesGrowth = Math.random() * 20 - 5 // Random between -5% and 15%
      const revenueGrowth = Math.random() * 15 - 2 // Random between -2% and 13%

      // Generate chart data based on actual sales
      const chartData = generateChartData(sales || [])

      setStats({
        totalSales,
        totalRevenue,
        totalProducts: productsCount || 0,
        totalCustomers: customersCount || 0,
        salesGrowth,
        revenueGrowth
      })
      setSalesData(chartData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (sales: any[]) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun']
    const currentDate = new Date()
    
    return months.map((month, index) => {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - index), 1)
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate.getMonth() === monthDate.getMonth() && 
               saleDate.getFullYear() === monthDate.getFullYear() &&
               sale.status === 'completed'
      })
      
      const vendas = monthSales.length
      const receita = monthSales.reduce((sum, sale) => sum + sale.total_amount, 0)
      
      return { month, vendas, receita }
    })
  }

  const statCards = [
    {
      title: 'Total de Vendas',
      value: stats.totalSales.toLocaleString(),
      change: stats.salesGrowth,
      icon: ShoppingCart,
      color: 'blue'
    },
    {
      title: 'Receita Total',
      value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: stats.revenueGrowth,
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Total de Produtos',
      value: stats.totalProducts.toLocaleString(),
      change: 5.2,
      icon: Package,
      color: 'purple'
    },
    {
      title: 'Total de Clientes',
      value: stats.totalCustomers.toLocaleString(),
      change: 3.1,
      icon: Users,
      color: 'orange'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const isPositive = card.change > 0
          
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1 break-all">{card.value}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-full bg-${card.color}-100 flex-shrink-0`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${card.color}-600`} />
                </div>
              </div>
              <div className="flex items-center mt-3 sm:mt-4">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-xs sm:text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(card.change)}%
                </span>
                <span className="text-xs sm:text-sm text-gray-500 ml-1 hidden sm:inline">vs mês anterior</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Vendas por Mês</h3>
          <ResponsiveContainer width="100%" height={250} minWidth={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="vendas" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Receita por Mês</h3>
          <ResponsiveContainer width="100%" height={250} minWidth={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="receita" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
        <div className="space-y-3 sm:space-y-4">
          {salesData.slice(-5).map((item, index) => (
            <div key={index} className="flex items-center space-x-3 sm:space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  Vendas em {item.month}: {item.vendas} transações
                </p>
                <p className="text-xs text-gray-500">
                  Receita: R$ {item.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}