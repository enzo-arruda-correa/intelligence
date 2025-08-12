import React, { useState, useEffect } from 'react'
import { Search, Filter, Eye, TrendingUp, DollarSign, Calendar, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useRealtime } from '../../hooks/useRealtime'
import type { Sale, SaleItem, Cliente, Employee } from '../../lib/supabase'

interface SaleWithDetails extends Sale {
  sale_items: SaleItem[]
  cliente?: Cliente
  employee?: Employee
}

export function SalesAnalysis() {
  const [sales, setSales] = useState<SaleWithDetails[]>([])
  const [filteredSales, setFilteredSales] = useState<SaleWithDetails[]>([])
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Setup realtime subscriptions
  useRealtime({
    table: 'sales',
    onInsert: (payload) => {
      fetchSales() // Refetch all data when new sale is added
    },
    onUpdate: (payload) => {
      setSales(prev => prev.map(sale => 
        sale.id === payload.new.id 
          ? { ...sale, ...payload.new }
          : sale
      ))
    },
    onDelete: (payload) => {
      setSales(prev => prev.filter(sale => sale.id !== payload.old.id))
    }
  })

  useRealtime({
    table: 'sale_items',
    onInsert: () => fetchSales(),
    onUpdate: () => fetchSales(),
    onDelete: () => fetchSales()
  })

  useEffect(() => {
    fetchSales()
  }, [])

  useEffect(() => {
    const filtered = sales.filter(sale =>
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSales(filtered)
    setCurrentPage(1)
  }, [searchTerm, sales])

  const fetchSales = async () => {
    try {
      setLoading(true)
      
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (*),
          clientes:cliente (
            id,
            nome,
            telefone,
            cpf
          ),
          employees:employee_id (
            id,
            name,
            code,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error fetching sales:', error)
        return
      }

      const salesWithDetails = salesData?.map(sale => ({
        ...sale,
        sale_items: sale.sale_items || [],
        cliente: sale.clientes,
        employee: sale.employees
      })) || []

      setSales(salesWithDetails)
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSaleMetrics = (sale: SaleWithDetails) => {
    const items = sale.sale_items || []
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const avgItemPrice = totalItems > 0 ? subtotal / totalItems : 0
    
    return {
      subtotal,
      totalItems,
      avgItemPrice,
      itemsCount: items.length
    }
  }

  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)

  // Calculate summary metrics
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const averageTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0
  const completedSales = filteredSales.filter(sale => sale.status === 'completed').length
  const pendingSales = filteredSales.filter(sale => sale.status === 'pending').length

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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Análise de Vendas</h1>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar vendas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-32 sm:w-auto"
            />
          </div>
          <button className="flex items-center px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <Filter className="w-4 h-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total de Vendas</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{filteredSales.length}</p>
            </div>
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
          </div>
          <div className="mt-2 text-xs sm:text-sm text-gray-500">
            {completedSales} concluídas, {pendingSales} pendentes
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-all">
                R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-all">
                R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Vendas Hoje</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {filteredSales.filter(sale => {
                  const today = new Date().toDateString()
                  const saleDate = new Date(sale.created_at).toDateString()
                  return today === saleDate
                }).length}
              </p>
            </div>
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Lista de Vendas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID da Venda
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Vendedor
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                    #{sale.id.slice(-8)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 max-w-[150px] truncate">
                    {sale.client_name || sale.cliente?.nome || 'Cliente não identificado'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                    {sale.employee?.name || 'Vendedor não identificado'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                    R$ {sale.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sale.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : sale.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {sale.status === 'completed' ? 'Concluída' : 
                       sale.status === 'pending' ? 'Pendente' : 'Cancelada'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <button
                      onClick={() => setSelectedSale(sale)}
                      className="text-blue-600 hover:text-blue-900 flex items-center text-xs sm:text-sm"
                    >
                      <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="hidden sm:inline">Analisar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <div className="text-xs sm:text-sm text-gray-500">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSales.length)} de {filteredSales.length} vendas
          </div>
          <div className="flex space-x-2 text-sm">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Análise Detalhada - Venda #{selectedSale.id.slice(-8)}
              </h3>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {(() => {
                const metrics = calculateSaleMetrics(selectedSale)
                return (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Sale Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-3 sm:space-y-4">
                        <h4 className="font-semibold text-gray-900">Informações da Venda</h4>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cliente:</span>
                            <span className="font-medium text-right max-w-[60%] truncate">
                              {selectedSale.client_name || selectedSale.cliente?.nome || 'Não identificado'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">CPF:</span>
                            <span className="font-medium">
                              {selectedSale.client_cpf || selectedSale.cliente?.cpf || 'Não informado'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Vendedor:</span>
                            <span className="font-medium">
                              {selectedSale.employee?.name || 'Não identificado'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Data:</span>
                            <span className="font-medium">{new Date(selectedSale.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-medium">
                              {selectedSale.status === 'completed' ? 'Concluída' : 
                               selectedSale.status === 'pending' ? 'Pendente' : 'Cancelada'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <h4 className="font-semibold text-gray-900">Análise Financeira</h4>
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium text-right">R$ {metrics.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total de Itens:</span>
                            <span className="font-medium">{metrics.totalItems}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Preço Médio/Item:</span>
                            <span className="font-medium">R$ {metrics.avgItemPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-900 font-semibold">Total:</span>
                            <span className="font-bold text-base sm:text-lg text-right">R$ {selectedSale.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4">Itens da Venda ({metrics.itemsCount})</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm min-w-[400px]">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 sm:px-4 py-2 text-left">Produto</th>
                              <th className="px-2 sm:px-4 py-2 text-left">Qtd</th>
                              <th className="px-2 sm:px-4 py-2 text-left">Preço Unit.</th>
                              <th className="px-2 sm:px-4 py-2 text-left">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedSale.sale_items.map((item, index) => (
                              <tr key={index}>
                                <td className="px-2 sm:px-4 py-2 max-w-[120px] truncate">{item.name}</td>
                                <td className="px-2 sm:px-4 py-2">{item.quantity}</td>
                                <td className="px-2 sm:px-4 py-2">R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="px-2 sm:px-4 py-2 font-medium">R$ {(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}