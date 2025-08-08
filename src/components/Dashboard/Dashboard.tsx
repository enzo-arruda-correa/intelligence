import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'

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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch sales data
      const { data: sales } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false })
        .limit(100)

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      // Calculate stats
      const totalSales = sales?.length || 0
      const totalRevenue = sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0

      // Generate mock sales chart data
      const chartData = [
        { month: 'Jan', vendas: 4000, receita: 24000 },
        { month: 'Fev', vendas: 3000, receita: 18000 },
        { month: 'Mar', vendas: 5000, receita: 30000 },
        { month: 'Abr', vendas: 4500, receita: 27000 },
        { month: 'Mai', vendas: 6000, receita: 36000 },
        { month: 'Jun', vendas: 5500, receita: 33000 },
      ]

      setStats({
        totalSales,
        totalRevenue,
        totalProducts: productsCount || 0,
        totalCustomers: 150, // Mock data
        salesGrowth: 12.5,
        revenueGrowth: 8.3
      })
      setSalesData(chartData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          const isPositive = card.change > 0
          
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${card.color}-100`}>
                  <Icon className={`w-6 h-6 text-${card.color}-600`} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(card.change)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Mês</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="vendas" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita por Mês</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="receita" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Nova venda registrada - Pedido #{1000 + item}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(Date.now() - item * 3600000).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="text-sm font-medium text-green-600">
                R$ {(Math.random() * 1000 + 100).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}