import React, { useState, useEffect } from 'react'
import { Search, Filter, BarChart3, TrendingUp, Package, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'
import type { Product, ProductVariation } from '../../lib/supabase'

interface ProductWithVariations extends Product {
  variations: ProductVariation[]
  total_sales: number
  total_revenue: number
  profit_margin: number
}

export function ProductsAnalysis() {
  const [products, setProducts] = useState<ProductWithVariations[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductWithVariations[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariations | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProducts(filtered)
    setCurrentPage(1)
  }, [searchTerm, products])

  const fetchProducts = async () => {
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select(`
          *,
          products_variations (*)
        `)
        .order('name')

      // Mock sales data for demonstration
      const productsWithAnalysis = productsData?.map(product => ({
        ...product,
        variations: product.products_variations || [],
        total_sales: Math.floor(Math.random() * 500) + 50,
        total_revenue: Math.floor(Math.random() * 50000) + 5000,
        profit_margin: Math.random() * 30 + 10
      })) || []

      setProducts(productsWithAnalysis)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateProductMetrics = (product: ProductWithVariations) => {
    const hasVariations = product.variations.length > 0
    const avgPrice = hasVariations 
      ? product.variations.reduce((sum, v) => sum + v.price, 0) / product.variations.length
      : product.base_price
    
    const avgCost = hasVariations
      ? product.variations.reduce((sum, v) => sum + v.cost_price, 0) / product.variations.length
      : product.cost_price

    const totalStock = hasVariations
      ? product.variations.reduce((sum, v) => sum + v.stock_quantity, 0)
      : 100 // Mock stock for base products

    const roi = ((avgPrice - avgCost) / avgCost) * 100
    const turnoverRate = product.total_sales / totalStock * 100

    return {
      hasVariations,
      avgPrice,
      avgCost,
      totalStock,
      roi,
      turnoverRate,
      profitPerUnit: avgPrice - avgCost
    }
  }

  const getTopProducts = () => {
    return [...filteredProducts]
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10)
      .map(product => ({
        name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
        receita: product.total_revenue,
        vendas: product.total_sales
      }))
  }

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

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
        <h1 className="text-3xl font-bold text-gray-900">Análise de Produtos</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar produtos..."
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
              <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">{filteredProducts.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {filteredProducts.reduce((sum, product) => sum + product.total_revenue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vendas Totais</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredProducts.reduce((sum, product) => sum + product.total_sales, 0).toLocaleString()}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Margem Média</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredProducts.length > 0 ? (filteredProducts.reduce((sum, product) => sum + product.profit_margin, 0) / filteredProducts.length).toFixed(1) : '0'}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Produtos por Receita</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={getTopProducts()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="receita" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Produtos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variações
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.description?.substring(0, 50)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.variations.length > 0 ? `${product.variations.length} variações` : 'Produto simples'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.total_sales.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    R$ {product.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.profit_margin > 20 
                        ? 'bg-green-100 text-green-800' 
                        : product.profit_margin > 10
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.profit_margin.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
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
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length} produtos
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Análise Detalhada - {selectedProduct.name}
              </h3>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {(() => {
                const metrics = calculateProductMetrics(selectedProduct)
                return (
                  <div className="space-y-6">
                    {/* Product Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Informações do Produto</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nome:</span>
                            <span className="font-medium">{selectedProduct.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">SKU:</span>
                            <span className="font-medium">{selectedProduct.sku}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Categoria:</span>
                            <span className="font-medium">{selectedProduct.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tipo:</span>
                            <span className="font-medium">{metrics.hasVariations ? 'Com variações' : 'Produto simples'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Estoque Total:</span>
                            <span className="font-medium">{metrics.totalStock} unidades</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">Análise Financeira</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Preço Médio:</span>
                            <span className="font-medium">R$ {metrics.avgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Custo Médio:</span>
                            <span className="font-medium">R$ {metrics.avgCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lucro por Unidade:</span>
                            <span className="font-medium text-green-600">R$ {metrics.profitPerUnit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">ROI:</span>
                            <span className="font-medium text-green-600">{metrics.roi.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Taxa de Giro:</span>
                            <span className="font-medium">{metrics.turnoverRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-900 font-semibold">Receita Total:</span>
                            <span className="font-bold text-lg">R$ {selectedProduct.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{selectedProduct.total_sales}</div>
                        <div className="text-sm text-blue-800">Total de Vendas</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{selectedProduct.profit_margin.toFixed(1)}%</div>
                        <div className="text-sm text-green-800">Margem de Lucro</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{metrics.turnoverRate.toFixed(1)}%</div>
                        <div className="text-sm text-purple-800">Taxa de Giro</div>
                      </div>
                    </div>

                    {/* Variations */}
                    {metrics.hasVariations && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Variações do Produto</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left">Nome</th>
                                <th className="px-4 py-2 text-left">SKU</th>
                                <th className="px-4 py-2 text-left">Preço</th>
                                <th className="px-4 py-2 text-left">Custo</th>
                                <th className="px-4 py-2 text-left">Estoque</th>
                                <th className="px-4 py-2 text-left">Margem</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {selectedProduct.variations.map((variation, index) => {
                                const margin = ((variation.price - variation.cost_price) / variation.price) * 100
                                return (
                                  <tr key={index}>
                                    <td className="px-4 py-2">{variation.name}</td>
                                    <td className="px-4 py-2">{variation.sku}</td>
                                    <td className="px-4 py-2">R$ {variation.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-4 py-2">R$ {variation.cost_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-4 py-2">{variation.stock_quantity}</td>
                                    <td className="px-4 py-2">
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        margin > 20 ? 'bg-green-100 text-green-800' : 
                                        margin > 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {margin.toFixed(1)}%
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
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