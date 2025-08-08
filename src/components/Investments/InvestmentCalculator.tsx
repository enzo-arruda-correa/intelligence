import React, { useState } from 'react'
import { Calculator, TrendingUp, DollarSign, Calendar, BarChart3 } from 'lucide-react'

interface ROICalculation {
  initialInvestment: number
  finalValue: number
  roi: number
  roiPercentage: number
}

interface PaybackCalculation {
  initialInvestment: number
  monthlyReturn: number
  paybackMonths: number
  paybackYears: number
}

interface CashFlowItem {
  month: number
  inflow: number
  outflow: number
  netFlow: number
  cumulativeFlow: number
}

export function InvestmentCalculator() {
  const [activeTab, setActiveTab] = useState<'roi' | 'payback' | 'cashflow' | 'inventory'>('roi')
  
  // ROI Calculator State
  const [roiData, setRoiData] = useState({
    initialInvestment: '',
    finalValue: '',
    timePeriod: ''
  })
  const [roiResult, setRoiResult] = useState<ROICalculation | null>(null)

  // Payback Calculator State
  const [paybackData, setPaybackData] = useState({
    initialInvestment: '',
    monthlyReturn: ''
  })
  const [paybackResult, setPaybackResult] = useState<PaybackCalculation | null>(null)

  // Cash Flow State
  const [cashFlowData, setCashFlowData] = useState({
    months: '12',
    initialCash: '10000'
  })
  const [cashFlowItems, setCashFlowItems] = useState<CashFlowItem[]>([])

  // Inventory Calculator State
  const [inventoryData, setInventoryData] = useState({
    averageInventory: '',
    costOfGoodsSold: '',
    timePeriod: '12'
  })
  const [inventoryResult, setInventoryResult] = useState<any>(null)

  const calculateROI = () => {
    const initial = parseFloat(roiData.initialInvestment)
    const final = parseFloat(roiData.finalValue)
    
    if (initial && final) {
      const roi = final - initial
      const roiPercentage = (roi / initial) * 100
      
      setRoiResult({
        initialInvestment: initial,
        finalValue: final,
        roi,
        roiPercentage
      })
    }
  }

  const calculatePayback = () => {
    const initial = parseFloat(paybackData.initialInvestment)
    const monthly = parseFloat(paybackData.monthlyReturn)
    
    if (initial && monthly && monthly > 0) {
      const paybackMonths = initial / monthly
      const paybackYears = paybackMonths / 12
      
      setPaybackResult({
        initialInvestment: initial,
        monthlyReturn: monthly,
        paybackMonths,
        paybackYears
      })
    }
  }

  const generateCashFlow = () => {
    const months = parseInt(cashFlowData.months)
    const initialCash = parseFloat(cashFlowData.initialCash)
    
    const items: CashFlowItem[] = []
    let cumulativeFlow = initialCash
    
    for (let i = 1; i <= months; i++) {
      // Mock data - in real scenario, user would input these values
      const inflow = Math.random() * 5000 + 3000
      const outflow = Math.random() * 4000 + 2000
      const netFlow = inflow - outflow
      cumulativeFlow += netFlow
      
      items.push({
        month: i,
        inflow,
        outflow,
        netFlow,
        cumulativeFlow
      })
    }
    
    setCashFlowItems(items)
  }

  const calculateInventory = () => {
    const avgInventory = parseFloat(inventoryData.averageInventory)
    const cogs = parseFloat(inventoryData.costOfGoodsSold)
    const period = parseInt(inventoryData.timePeriod)
    
    if (avgInventory && cogs && period) {
      const turnoverRatio = cogs / avgInventory
      const daysInInventory = (period * 30) / turnoverRatio
      const inventoryValue = avgInventory
      const monthlyTurnover = turnoverRatio / (period / 12)
      
      setInventoryResult({
        turnoverRatio,
        daysInInventory,
        inventoryValue,
        monthlyTurnover,
        efficiency: turnoverRatio > 6 ? 'Alta' : turnoverRatio > 3 ? 'Média' : 'Baixa'
      })
    }
  }

  const tabs = [
    { id: 'roi', label: 'ROI', icon: TrendingUp },
    { id: 'payback', label: 'Payback', icon: Calendar },
    { id: 'cashflow', label: 'Fluxo de Caixa', icon: DollarSign },
    { id: 'inventory', label: 'Estoque', icon: BarChart3 }
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Calculadora de Investimentos</h1>
        <Calculator className="w-8 h-8 text-blue-600" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* ROI Calculator */}
      {activeTab === 'roi' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculadora de ROI</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investimento Inicial (R$)
                </label>
                <input
                  type="number"
                  value={roiData.initialInvestment}
                  onChange={(e) => setRoiData({...roiData, initialInvestment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Final (R$)
                </label>
                <input
                  type="number"
                  value={roiData.finalValue}
                  onChange={(e) => setRoiData({...roiData, finalValue: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="15000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período (meses)
                </label>
                <input
                  type="number"
                  value={roiData.timePeriod}
                  onChange={(e) => setRoiData({...roiData, timePeriod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="12"
                />
              </div>
              <button
                onClick={calculateROI}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Calcular ROI
              </button>
            </div>
          </div>

          {roiResult && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado do ROI</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {roiResult.roiPercentage.toFixed(2)}%
                  </div>
                  <div className="text-sm text-blue-800">Retorno sobre Investimento</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Investimento Inicial:</span>
                    <span className="font-medium">R$ {roiResult.initialInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Final:</span>
                    <span className="font-medium">R$ {roiResult.finalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-semibold">Lucro:</span>
                    <span className="font-bold text-green-600">R$ {roiResult.roi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                  <strong>Interpretação:</strong> {roiResult.roiPercentage > 0 ? 'Investimento rentável' : 'Investimento com prejuízo'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payback Calculator */}
      {activeTab === 'payback' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculadora de Payback</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investimento Inicial (R$)
                </label>
                <input
                  type="number"
                  value={paybackData.initialInvestment}
                  onChange={(e) => setPaybackData({...paybackData, initialInvestment: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retorno Mensal (R$)
                </label>
                <input
                  type="number"
                  value={paybackData.monthlyReturn}
                  onChange={(e) => setPaybackData({...paybackData, monthlyReturn: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000"
                />
              </div>
              <button
                onClick={calculatePayback}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Calcular Payback
              </button>
            </div>
          </div>

          {paybackResult && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado do Payback</h3>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {paybackResult.paybackYears.toFixed(1)} anos
                  </div>
                  <div className="text-sm text-green-800">Tempo de Retorno</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Investimento:</span>
                    <span className="font-medium">R$ {paybackResult.initialInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retorno Mensal:</span>
                    <span className="font-medium">R$ {paybackResult.monthlyReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-semibold">Payback em Meses:</span>
                    <span className="font-bold">{paybackResult.paybackMonths.toFixed(1)} meses</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                  <strong>Interpretação:</strong> {paybackResult.paybackYears < 2 ? 'Retorno rápido' : paybackResult.paybackYears < 5 ? 'Retorno moderado' : 'Retorno longo'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cash Flow */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerador de Fluxo de Caixa</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período (meses)
                </label>
                <input
                  type="number"
                  value={cashFlowData.months}
                  onChange={(e) => setCashFlowData({...cashFlowData, months: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caixa Inicial (R$)
                </label>
                <input
                  type="number"
                  value={cashFlowData.initialCash}
                  onChange={(e) => setCashFlowData({...cashFlowData, initialCash: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={generateCashFlow}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Gerar Fluxo
                </button>
              </div>
            </div>
          </div>

          {cashFlowItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Projeção de Fluxo de Caixa</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Mês</th>
                      <th className="px-4 py-2 text-left">Entradas</th>
                      <th className="px-4 py-2 text-left">Saídas</th>
                      <th className="px-4 py-2 text-left">Fluxo Líquido</th>
                      <th className="px-4 py-2 text-left">Saldo Acumulado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cashFlowItems.map((item) => (
                      <tr key={item.month}>
                        <td className="px-4 py-2 font-medium">{item.month}</td>
                        <td className="px-4 py-2 text-green-600">R$ {item.inflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2 text-red-600">R$ {item.outflow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className={`px-4 py-2 font-medium ${item.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {item.netFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`px-4 py-2 font-bold ${item.cumulativeFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {item.cumulativeFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Calculator */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Análise de Estoque</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque Médio (R$)
                </label>
                <input
                  type="number"
                  value={inventoryData.averageInventory}
                  onChange={(e) => setInventoryData({...inventoryData, averageInventory: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custo dos Produtos Vendidos (R$)
                </label>
                <input
                  type="number"
                  value={inventoryData.costOfGoodsSold}
                  onChange={(e) => setInventoryData({...inventoryData, costOfGoodsSold: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="600000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período (meses)
                </label>
                <select
                  value={inventoryData.timePeriod}
                  onChange={(e) => setInventoryData({...inventoryData, timePeriod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="12">12 meses</option>
                  <option value="6">6 meses</option>
                  <option value="3">3 meses</option>
                </select>
              </div>
              <button
                onClick={calculateInventory}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Analisar Estoque
              </button>
            </div>
          </div>

          {inventoryResult && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado da Análise</h3>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {inventoryResult.turnoverRatio.toFixed(2)}x
                  </div>
                  <div className="text-sm text-purple-800">Giro de Estoque</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dias em Estoque:</span>
                    <span className="font-medium">{inventoryResult.daysInInventory.toFixed(0)} dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giro Mensal:</span>
                    <span className="font-medium">{inventoryResult.monthlyTurnover.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Eficiência:</span>
                    <span className={`font-medium ${
                      inventoryResult.efficiency === 'Alta' ? 'text-green-600' :
                      inventoryResult.efficiency === 'Média' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {inventoryResult.efficiency}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                  <strong>Interpretação:</strong> {
                    inventoryResult.efficiency === 'Alta' ? 'Estoque girando rapidamente, boa gestão' :
                    inventoryResult.efficiency === 'Média' ? 'Giro moderado, pode ser otimizado' :
                    'Giro lento, revisar estratégia de estoque'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}