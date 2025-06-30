import React, { useState, useMemo } from 'react';
import { DollarSign, Calculator, TrendingUp, PieChart, Target, Calendar } from 'lucide-react';

interface FinancialCalculation {
  type: string;
  result: number;
  details: any;
}

export function FinancialCalculator() {
  const [activeCalculator, setActiveCalculator] = useState('roi');
  const [formData, setFormData] = useState({
    // ROI
    initialInvestment: 0,
    finalValue: 0,
    
    // Payback
    investment: 0,
    monthlyReturn: 0,
    
    // NPV
    cashFlows: [0, 0, 0, 0, 0],
    discountRate: 10,
    
    // Financing
    loanAmount: 0,
    interestRate: 0,
    periods: 12,
    
    // Working Capital
    averageSales: 0,
    receivingDays: 30,
    paymentDays: 30,
    stockDays: 30,
    
    // Markup
    cost: 0,
    desiredMargin: 30
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const calculations = useMemo(() => {
    const results: Record<string, FinancialCalculation> = {};

    // ROI Calculation
    if (formData.initialInvestment > 0) {
      const roi = ((formData.finalValue - formData.initialInvestment) / formData.initialInvestment) * 100;
      results.roi = {
        type: 'ROI',
        result: roi,
        details: {
          gain: formData.finalValue - formData.initialInvestment,
          percentage: roi
        }
      };
    }

    // Payback Calculation
    if (formData.investment > 0 && formData.monthlyReturn > 0) {
      const paybackMonths = formData.investment / formData.monthlyReturn;
      results.payback = {
        type: 'Payback',
        result: paybackMonths,
        details: {
          months: paybackMonths,
          years: paybackMonths / 12
        }
      };
    }

    // NPV Calculation
    if (formData.cashFlows.some(cf => cf !== 0)) {
      const rate = formData.discountRate / 100;
      let npv = -formData.cashFlows[0]; // Initial investment (negative)
      
      for (let i = 1; i < formData.cashFlows.length; i++) {
        npv += formData.cashFlows[i] / Math.pow(1 + rate, i);
      }
      
      results.npv = {
        type: 'NPV',
        result: npv,
        details: {
          isViable: npv > 0,
          totalCashFlow: formData.cashFlows.reduce((sum, cf) => sum + cf, 0)
        }
      };
    }

    // Financing Calculation
    if (formData.loanAmount > 0 && formData.interestRate > 0) {
      const monthlyRate = formData.interestRate / 100 / 12;
      const installment = formData.loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, formData.periods)) / 
                         (Math.pow(1 + monthlyRate, formData.periods) - 1);
      const totalAmount = installment * formData.periods;
      const totalInterest = totalAmount - formData.loanAmount;
      
      results.financing = {
        type: 'Financing',
        result: installment,
        details: {
          installment,
          totalAmount,
          totalInterest,
          effectiveRate: (totalInterest / formData.loanAmount) * 100
        }
      };
    }

    // Working Capital Calculation
    if (formData.averageSales > 0) {
      const dailySales = formData.averageSales / 30;
      const accountsReceivable = dailySales * formData.receivingDays;
      const inventory = dailySales * formData.stockDays;
      const accountsPayable = dailySales * formData.paymentDays;
      const workingCapital = accountsReceivable + inventory - accountsPayable;
      
      results.workingCapital = {
        type: 'Working Capital',
        result: workingCapital,
        details: {
          accountsReceivable,
          inventory,
          accountsPayable,
          operatingCycle: formData.receivingDays + formData.stockDays,
          cashCycle: formData.receivingDays + formData.stockDays - formData.paymentDays
        }
      };
    }

    // Markup Calculation
    if (formData.cost > 0) {
      const markupMultiplier = 100 / (100 - formData.desiredMargin);
      const salePrice = formData.cost * markupMultiplier;
      const profit = salePrice - formData.cost;
      
      results.markup = {
        type: 'Markup',
        result: salePrice,
        details: {
          salePrice,
          profit,
          markupPercentage: ((salePrice - formData.cost) / formData.cost) * 100,
          marginPercentage: formData.desiredMargin
        }
      };
    }

    return results;
  }, [formData]);

  const calculatorTabs = [
    { id: 'roi', label: 'ROI', icon: TrendingUp },
    { id: 'payback', label: 'Payback', icon: Calendar },
    { id: 'npv', label: 'VPL', icon: Calculator },
    { id: 'financing', label: 'Financiamento', icon: DollarSign },
    { id: 'workingCapital', label: 'Capital de Giro', icon: PieChart },
    { id: 'markup', label: 'Markup', icon: Target }
  ];

  const renderCalculatorForm = () => {
    switch (activeCalculator) {
      case 'roi':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Retorno sobre Investimento (ROI)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Investimento Inicial (R$)</label>
                <input
                  type="number"
                  value={formData.initialInvestment}
                  onChange={(e) => setFormData({ ...formData, initialInvestment: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor Final (R$)</label>
                <input
                  type="number"
                  value={formData.finalValue}
                  onChange={(e) => setFormData({ ...formData, finalValue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {calculations.roi && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h5 className="font-semibold text-blue-900 mb-3">Resultado</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-700">ROI</p>
                    <p className="text-2xl font-bold text-blue-900">{formatPercentage(calculations.roi.result)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Ganho</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(calculations.roi.details.gain)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'payback':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Tempo de Retorno (Payback)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Investimento (R$)</label>
                <input
                  type="number"
                  value={formData.investment}
                  onChange={(e) => setFormData({ ...formData, investment: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Retorno Mensal (R$)</label>
                <input
                  type="number"
                  value={formData.monthlyReturn}
                  onChange={(e) => setFormData({ ...formData, monthlyReturn: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {calculations.payback && (
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h5 className="font-semibold text-green-900 mb-3">Resultado</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-green-700">Tempo em Meses</p>
                    <p className="text-2xl font-bold text-green-900">{calculations.payback.details.months.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Tempo em Anos</p>
                    <p className="text-2xl font-bold text-green-900">{calculations.payback.details.years.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'markup':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Cálculo de Markup</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custo do Produto (R$)</label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Margem Desejada (%)</label>
                <input
                  type="number"
                  value={formData.desiredMargin}
                  onChange={(e) => setFormData({ ...formData, desiredMargin: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {calculations.markup && (
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h5 className="font-semibold text-purple-900 mb-3">Resultado</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-purple-700">Preço de Venda</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(calculations.markup.details.salePrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700">Lucro</p>
                    <p className="text-2xl font-bold text-purple-900">{formatCurrency(calculations.markup.details.profit)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="text-sm text-purple-700">Markup: {formatPercentage(calculations.markup.details.markupPercentage)}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'workingCapital':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Capital de Giro</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendas Médias Mensais (R$)</label>
                <input
                  type="number"
                  value={formData.averageSales}
                  onChange={(e) => setFormData({ ...formData, averageSales: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prazo de Recebimento (dias)</label>
                <input
                  type="number"
                  value={formData.receivingDays}
                  onChange={(e) => setFormData({ ...formData, receivingDays: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prazo de Pagamento (dias)</label>
                <input
                  type="number"
                  value={formData.paymentDays}
                  onChange={(e) => setFormData({ ...formData, paymentDays: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giro de Estoque (dias)</label>
                <input
                  type="number"
                  value={formData.stockDays}
                  onChange={(e) => setFormData({ ...formData, stockDays: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {calculations.workingCapital && (
              <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                <h5 className="font-semibold text-orange-900 mb-3">Resultado</h5>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-orange-700">Capital de Giro Necessário</p>
                    <p className="text-2xl font-bold text-orange-900">{formatCurrency(calculations.workingCapital.result)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-orange-700">Ciclo de Caixa</p>
                    <p className="text-2xl font-bold text-orange-900">{calculations.workingCapital.details.cashCycle} dias</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-orange-700">Contas a Receber</p>
                    <p className="font-semibold text-orange-900">{formatCurrency(calculations.workingCapital.details.accountsReceivable)}</p>
                  </div>
                  <div>
                    <p className="text-orange-700">Estoque</p>
                    <p className="font-semibold text-orange-900">{formatCurrency(calculations.workingCapital.details.inventory)}</p>
                  </div>
                  <div>
                    <p className="text-orange-700">Contas a Pagar</p>
                    <p className="font-semibold text-orange-900">{formatCurrency(calculations.workingCapital.details.accountsPayable)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div>Selecione uma calculadora</div>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Calculadora Financeira</h2>
        <p className="text-gray-600">Ferramentas essenciais para análise financeira empresarial</p>
      </div>

      {/* Navegação por Abas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex space-x-8 px-6 overflow-x-auto">
            {calculatorTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveCalculator(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeCalculator === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-8">
          {renderCalculatorForm()}
        </div>
      </div>

      {/* Dicas e Informações */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Dicas Importantes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">ROI (Return on Investment)</h4>
            <p className="text-sm text-gray-600">
              Mede a eficiência de um investimento. Um ROI positivo indica que o investimento gerou lucro.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Payback</h4>
            <p className="text-sm text-gray-600">
              Tempo necessário para recuperar o investimento inicial. Quanto menor, melhor.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Capital de Giro</h4>
            <p className="text-sm text-gray-600">
              Recursos necessários para manter as operações da empresa funcionando no dia a dia.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Markup</h4>
            <p className="text-sm text-gray-600">
              Percentual adicionado ao custo para formar o preço de venda e garantir a margem desejada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}