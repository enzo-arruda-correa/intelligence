import React, { useState, useEffect } from 'react'
import { Search, Filter, Eye, TrendingUp, DollarSign, Calendar, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Sale, SaleItem } from '../../lib/supabase'

interface SaleWithItems extends Sale {
  items: SaleItem[]
  customer_name?: string
  seller_name?: string
}

export function SalesAnalysis() {
  const [sales, setSales] = useState<SaleWithItems[]>([])
  const [filteredSales, setFilteredSales] = useState<SaleWithItems[]>([])
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchSales()
  }, [])

  useEffect(() => {
    const filtered = sales.filter(sale =>
      sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.seller_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredSales(filtered)
    setCurrentPage(1)
  }, [searchTerm, sales])

  const fetchSales = async () => {
    try {
      const { data: salesData } = await supabase
        .from('sales')
        .select(`
          *,
          sales_items (*)
        `)
        .order('sale_date', { ascending: false })
        .limit(100)

      // Mock customer and seller names for demonstration
      const salesWithNames = salesData?.map(sale => ({
        ...sale,
        items: sale.sales_items || [],
        customer_name: `Cliente ${sale.customer_id.slice(-4)}`,
        seller_name: `Vendedor ${sale.seller_id.slice(-4)}`
      })) || []

      setSales(salesWithNames)
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSaleMetrics = (sale: SaleWithItems) => {
    const subtotal = sale.total_amount - sale.tax_amount + sale.discount_amount
    const taxRate = (sale.tax_amount / subtotal) * 100
    const discountRate = (sale.discount_amount / subtotal) * 100
    const profit = sale.items.reduce((sum, item) => {
      // Mock cost calculation - in real scenario, get from product cost
      const estimatedCost = item.unit_price * 0.6
      return sum + ((item.unit_price - estimatedCost) * item.quantity)
    }, 0)
    const profitMargin = (profit / sale.total_amount) * 100

    return {
      subtotal,
      taxRate,
      discountRate,
      profit,
      profitMargin
    }
  }

  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)

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
        <h1 className="text-3xl font-bold text-gray-900">Análise de Vendas</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar vendas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
              <p className="text-2xl font-bold text-gray-900">{filteredSales.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {filteredSales.length > 0 ? (filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0) / filteredSales.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Impostos Totais</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {filteredSales.reduce((sum, sale) => sum + sale.tax_amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <User className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Vendas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID da Venda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{sale.id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sale.seller_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    R$ {sale.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedSale(sale)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Analisar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSales.length)} de {filteredSales.length} vendas
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Análise Detalhada - Venda #{selectedSale.id.slice(-8)}
              </h3>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {(() => {
                const metrics = calculateSaleMetrics(selectedSale)
                return (
                  <div className="space-y-6">
                    {/* Sale Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Informações da Venda</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Cliente:</span>
                            <span className="font-medium">{selectedSale.customer_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Vendedor:</span>
                            <span className="font-medium">{selectedSale.seller_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Data:</span>
                            <span className="font-medium">{new Date(selectedSale.sale_date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <span className="font-medium">{selectedSale.status === 'completed' ? 'Concluída' : selectedSale.status === 'pending' ? 'Pendente' : 'Cancelada'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Análise Financeira</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">R$ {metrics.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Desconto:</span>
                            <span className="font-medium text-red-600">-R$ {selectedSale.discount_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({metrics.discountRate.toFixed(1)}%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Impostos:</span>
                            <span className="font-medium">R$ {selectedSale.tax_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({metrics.taxRate.toFixed(1)}%)</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-900 font-semibold">Total:</span>
                            <span className="font-bold text-lg">R$ {selectedSale.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lucro Estimado:</span>
                            <span className="font-medium text-green-600">R$ {metrics.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({metrics.profitMargin.toFixed(1)}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Itens da Venda</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left">Produto</th>
                              <th className="px-4 py-2 text-left">Quantidade</th>
                              <th className="px-4 py-2 text-left">Preço Unit.</th>
                              <th className="px-4 py-2 text-left">Desconto</th>
                              <th className="px-4 py-2 text-left">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedSale.items.map((item, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2">Produto {item.product_id.slice(-4)}</td>
                                <td className="px-4 py-2">{item.quantity}</td>
                                <td className="px-4 py-2">R$ {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-2 text-red-600">-R$ {item.discount_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-2 font-medium">R$ {item.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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