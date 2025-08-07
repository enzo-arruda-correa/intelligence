import React, { useState, useMemo } from 'react';
import { useERP } from '../../contexts/ERPContext';
import { CostCalculationService } from '../../services/costCalculationService';
import { Product } from '../../types';
import { 
  Calculator, 
  TrendingUp, 
  Target, 
  DollarSign, 
  BarChart3,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react';

interface BreakEvenSimulation {
  product: Product;
  currentBreakEven: number;
  newPrice?: number;
  newFixedCost?: number;
  newVariableCost?: number;
  simulatedBreakEven?: number;
  impact?: number;
}

export function BreakEvenAnalysis() {
  const { products } = useERP();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [simulationMode, setSimulationMode] = useState<'price' | 'fixed' | 'variable'>('price');
  const [simulationValue, setSimulationValue] = useState<number>(0);
  const [targetProfit, setTargetProfit] = useState<number>(0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value));
  };

  // Cálculos para todos os produtos
  const productAnalyses = useMemo(() => {
    return products.map(product => {
      try {
        const calculation = CostCalculationService.calculateProductCost(product);
        const breakEven = CostCalculationService.calculateBreakEvenPoint(
          product.allocatedFixedCost,
          product.salePrice,
          calculation.totalProductionCost
        );
        
        return {
          product,
          calculation,
          breakEven,
          contributionMargin: calculation.contributionMargin,
          contributionMarginPercent: (calculation.contributionMargin / product.salePrice) * 100
        };
      } catch {
        return null;
      }
    }).filter(Boolean) as Array<{
      product: Product;
      calculation: any;
      breakEven: number;
      contributionMargin: number;
      contributionMarginPercent: number;
    }>;
  }, [products]);

  // Produto selecionado para simulação
  const selectedProductAnalysis = useMemo(() => {
    if (!selectedProduct) return null;
    return productAnalyses.find(p => p.product.id === selectedProduct);
  }, [selectedProduct, productAnalyses]);

  // Simulação de cenários
  const simulation = useMemo(() => {
    if (!selectedProductAnalysis || simulationValue === 0) return null;

    const { product, calculation } = selectedProductAnalysis;
    let newBreakEven = 0;

    switch (simulationMode) {
      case 'price':
        newBreakEven = CostCalculationService.calculateBreakEvenPoint(
          product.allocatedFixedCost,
          simulationValue,
          calculation.totalProductionCost
        );
        break;
      case 'fixed':
        newBreakEven = CostCalculationService.calculateBreakEvenPoint(
          simulationValue,
          product.salePrice,
          calculation.totalProductionCost
        );
        break;
      case 'variable':
        newBreakEven = CostCalculationService.calculateBreakEvenPoint(
          product.allocatedFixedCost,
          product.salePrice,
          simulationValue
        );
        break;
    }

    const impact = ((newBreakEven - selectedProductAnalysis.breakEven) / selectedProductAnalysis.breakEven) * 100;

    return {
      currentBreakEven: selectedProductAnalysis.breakEven,
      newBreakEven,
      impact,
      isImprovement: newBreakEven < selectedProductAnalysis.breakEven
    };
  }, [selectedProductAnalysis, simulationMode, simulationValue]);

  // Cálculo de volume para lucro alvo
  const targetVolumeCalculation = useMemo(() => {
    if (!selectedProductAnalysis || targetProfit === 0) return null;

    const { product, contributionMargin } = selectedProductAnalysis;
    if (contributionMargin <= 0) return null;

    const requiredVolume = (product.allocatedFixedCost + targetProfit) / contributionMargin;
    const revenueNeeded = requiredVolume * product.salePrice;
    const totalCosts = product.allocatedFixedCost + (requiredVolume * selectedProductAnalysis.calculation.totalProductionCost);

    return {
      volume: Math.ceil(requiredVolume),
      revenue: revenueNeeded,
      totalCosts,
      profit: revenueNeeded - totalCosts
    };
  }, [selectedProductAnalysis, targetProfit]);

  return (
    <div className="space-y-8">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Produtos Analisados</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{productAnalyses.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Menor Ponto de Equilíbrio</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {productAnalyses.length > 0 ? formatNumber(Math.min(...productAnalyses.map(p => p.breakEven))) : '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Maior Ponto de Equilíbrio</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {productAnalyses.length > 0 ? formatNumber(Math.max(...productAnalyses.map(p => p.breakEven))) : '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Margem Média</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {productAnalyses.length > 0 
                  ? `${(productAnalyses.reduce((sum, p) => sum + p.contributionMarginPercent, 0) / productAnalyses.length).toFixed(1)}%`
                  : '0%'
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tabela de Análise por Produto */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">Análise por Produto</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Produto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ponto Equilíbrio</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Margem Contrib.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productAnalyses.map(({ product, breakEven, contributionMargin, contributionMarginPercent }) => (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${selectedProduct === product.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedProduct(product.id)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.code}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{formatNumber(breakEven)} un</div>
                      <div className="text-xs text-gray-500">{formatCurrency(breakEven * product.salePrice)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(contributionMargin)}</div>
                      <div className={`text-xs font-medium ${contributionMarginPercent > 30 ? 'text-green-600' : contributionMarginPercent > 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {contributionMarginPercent.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simulador de Cenários */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Zap className="w-5 h-5 text-yellow-500 mr-2" />
              Simulador de Cenários
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {!selectedProduct ? (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-medium">Selecione um produto na tabela ao lado para simular cenários</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Simulação</label>
                  <select
                    value={simulationMode}
                    onChange={(e) => setSimulationMode(e.target.value as 'price' | 'fixed' | 'variable')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="price">Alteração no Preço de Venda</option>
                    <option value="fixed">Alteração nos Custos Fixos</option>
                    <option value="variable">Alteração nos Custos Variáveis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Novo Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={simulationValue}
                    onChange={(e) => setSimulationValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o novo valor"
                  />
                </div>

                {simulation && (
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <h4 className="font-semibold text-gray-900">Resultado da Simulação</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Ponto Atual:</span>
                        <div className="font-semibold text-lg">{formatNumber(simulation.currentBreakEven)} un</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Novo Ponto:</span>
                        <div className="font-semibold text-lg">{formatNumber(simulation.newBreakEven)} un</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Impacto:</span>
                        <div className={`font-bold text-lg ${simulation.isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                          {simulation.impact > 0 ? '+' : ''}{simulation.impact.toFixed(1)}%
                          {simulation.isImprovement ? ' (Melhoria)' : ' (Piora)'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Calculadora de Volume para Lucro Alvo */}
      {selectedProduct && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Target className="w-5 h-5 text-green-500 mr-2" />
              Calculadora de Volume para Lucro Alvo
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lucro Desejado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetProfit}
                  onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o lucro desejado"
                />
              </div>

              {targetVolumeCalculation && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Resultado</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume necessário:</span>
                      <span className="font-bold text-green-600 text-lg">{formatNumber(targetVolumeCalculation.volume)} un</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Receita total:</span>
                      <span className="font-medium">{formatCurrency(targetVolumeCalculation.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Custos totais:</span>
                      <span className="font-medium">{formatCurrency(targetVolumeCalculation.totalCosts)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-900 font-semibold">Lucro resultante:</span>
                      <span className="font-bold text-green-600">{formatCurrency(targetVolumeCalculation.profit)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}