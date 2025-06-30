import React, { useState, useMemo } from 'react';
import { Receipt, Calculator, DollarSign, Percent, FileText, AlertCircle } from 'lucide-react';

interface TaxCalculation {
  regime: 'simples' | 'presumido' | 'real';
  revenue: number;
  expenses?: number;
  activity: string;
  taxes: {
    irpj: number;
    csll: number;
    pis: number;
    cofins: number;
    icms: number;
    iss: number;
    cpp: number;
    total: number;
  };
  netIncome: number;
  effectiveRate: number;
}

export function TaxCalculator() {
  const [formData, setFormData] = useState({
    regime: 'simples' as 'simples' | 'presumido' | 'real',
    revenue: 0,
    expenses: 0,
    activity: 'comercio',
    anexo: 'I' as 'I' | 'II' | 'III' | 'IV' | 'V'
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const calculateTaxes = useMemo((): TaxCalculation => {
    const { regime, revenue, expenses, activity, anexo } = formData;
    
    let taxes = {
      irpj: 0,
      csll: 0,
      pis: 0,
      cofins: 0,
      icms: 0,
      iss: 0,
      cpp: 0,
      total: 0
    };

    if (regime === 'simples') {
      // Simples Nacional - Alíquotas por anexo e faixa de receita
      const simplesRates = {
        'I': { // Comércio
          rate: revenue <= 180000 ? 4.0 : revenue <= 360000 ? 7.3 : revenue <= 720000 ? 9.5 : 10.7,
          irpj: 5.5, csll: 3.5, cofins: 12.74, pis: 2.76, cpp: 41.5, icms: 34.0
        },
        'II': { // Indústria
          rate: revenue <= 180000 ? 4.5 : revenue <= 360000 ? 7.8 : revenue <= 720000 ? 10.0 : 11.2,
          irpj: 5.5, csll: 3.5, cofins: 12.74, pis: 2.76, cpp: 41.5, icms: 34.0
        },
        'III': { // Serviços
          rate: revenue <= 180000 ? 6.0 : revenue <= 360000 ? 11.2 : revenue <= 720000 ? 13.5 : 16.0,
          irpj: 4.0, csll: 3.27, cofins: 12.82, pis: 2.78, cpp: 43.4, iss: 33.73
        },
        'IV': { // Serviços
          rate: revenue <= 180000 ? 4.5 : revenue <= 360000 ? 9.0 : revenue <= 720000 ? 10.2 : 14.0,
          irpj: 4.0, csll: 3.27, cofins: 0, pis: 0, cpp: 43.4, iss: 49.33
        },
        'V': { // Serviços
          rate: revenue <= 180000 ? 15.5 : revenue <= 360000 ? 18.0 : revenue <= 720000 ? 19.5 : 20.5,
          irpj: 25.0, csll: 15.0, cofins: 14.05, pis: 3.05, cpp: 28.85, iss: 14.05
        }
      };

      const rateConfig = simplesRates[anexo];
      const totalTax = (revenue * rateConfig.rate) / 100;
      
      taxes.irpj = (totalTax * rateConfig.irpj) / 100;
      taxes.csll = (totalTax * rateConfig.csll) / 100;
      taxes.pis = (totalTax * rateConfig.pis) / 100;
      taxes.cofins = (totalTax * rateConfig.cofins) / 100;
      taxes.cpp = (totalTax * rateConfig.cpp) / 100;
      
      if (anexo === 'I' || anexo === 'II') {
        taxes.icms = (totalTax * rateConfig.icms) / 100;
      } else {
        taxes.iss = (totalTax * (rateConfig.iss || 0)) / 100;
      }
      
      taxes.total = totalTax;

    } else if (regime === 'presumido') {
      // Lucro Presumido
      const presumedProfitRate = activity === 'servicos' ? 32 : 8;
      const presumedProfit = (revenue * presumedProfitRate) / 100;
      
      taxes.irpj = presumedProfit * 0.15 + (presumedProfit > 20000 ? (presumedProfit - 20000) * 0.10 : 0);
      taxes.csll = presumedProfit * 0.09;
      taxes.pis = revenue * 0.0065;
      taxes.cofins = revenue * 0.03;
      taxes.cpp = revenue * 0.20; // Estimativa
      
      if (activity === 'servicos') {
        taxes.iss = revenue * 0.05; // Média municipal
      } else {
        taxes.icms = revenue * 0.18; // Média estadual
      }
      
      taxes.total = Object.values(taxes).reduce((sum, tax) => sum + tax, 0);

    } else if (regime === 'real') {
      // Lucro Real
      const realProfit = revenue - expenses;
      
      if (realProfit > 0) {
        taxes.irpj = realProfit * 0.15 + (realProfit > 240000 ? (realProfit - 240000) * 0.10 : 0);
        taxes.csll = realProfit * 0.09;
      }
      
      taxes.pis = revenue * 0.0165;
      taxes.cofins = revenue * 0.076;
      taxes.cpp = revenue * 0.20; // Estimativa
      
      if (activity === 'servicos') {
        taxes.iss = revenue * 0.05;
      } else {
        taxes.icms = revenue * 0.18;
      }
      
      taxes.total = Object.values(taxes).reduce((sum, tax) => sum + tax, 0);
    }

    const netIncome = revenue - taxes.total;
    const effectiveRate = revenue > 0 ? (taxes.total / revenue) * 100 : 0;

    return {
      regime,
      revenue,
      expenses,
      activity,
      taxes,
      netIncome,
      effectiveRate
    };
  }, [formData]);

  const regimeComparison = useMemo(() => {
    const originalRegime = formData.regime;
    const comparisons = [];

    ['simples', 'presumido', 'real'].forEach(regime => {
      const tempFormData = { ...formData, regime: regime as any };
      // Recalcular para cada regime
      let taxes = { total: 0 };
      
      if (regime === 'simples') {
        const rateConfig = {
          'I': 4.0, 'II': 4.5, 'III': 6.0, 'IV': 4.5, 'V': 15.5
        };
        taxes.total = (tempFormData.revenue * rateConfig[tempFormData.anexo as keyof typeof rateConfig]) / 100;
      } else if (regime === 'presumido') {
        const presumedProfitRate = tempFormData.activity === 'servicos' ? 32 : 8;
        const presumedProfit = (tempFormData.revenue * presumedProfitRate) / 100;
        taxes.total = presumedProfit * 0.24 + tempFormData.revenue * 0.0965;
      } else {
        const realProfit = tempFormData.revenue - tempFormData.expenses;
        taxes.total = (realProfit > 0 ? realProfit * 0.24 : 0) + tempFormData.revenue * 0.0965;
      }

      comparisons.push({
        regime,
        totalTax: taxes.total,
        netIncome: tempFormData.revenue - taxes.total,
        effectiveRate: tempFormData.revenue > 0 ? (taxes.total / tempFormData.revenue) * 100 : 0
      });
    });

    return comparisons.sort((a, b) => a.totalTax - b.totalTax);
  }, [formData]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Calculadora de Impostos</h2>
        <p className="text-gray-600">Calcule e compare impostos entre diferentes regimes tributários</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Dados da Empresa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Regime Tributário</label>
                <select
                  value={formData.regime}
                  onChange={(e) => setFormData({ ...formData, regime: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="simples">Simples Nacional</option>
                  <option value="presumido">Lucro Presumido</option>
                  <option value="real">Lucro Real</option>
                </select>
              </div>

              {formData.regime === 'simples' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Anexo do Simples</label>
                  <select
                    value={formData.anexo}
                    onChange={(e) => setFormData({ ...formData, anexo: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="I">Anexo I - Comércio</option>
                    <option value="II">Anexo II - Indústria</option>
                    <option value="III">Anexo III - Serviços</option>
                    <option value="IV">Anexo IV - Serviços</option>
                    <option value="V">Anexo V - Serviços</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Atividade Principal</label>
                <select
                  value={formData.activity}
                  onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="comercio">Comércio</option>
                  <option value="industria">Indústria</option>
                  <option value="servicos">Serviços</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Receita Bruta Anual (R$)</label>
                <input
                  type="number"
                  value={formData.revenue}
                  onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 500000"
                />
              </div>

              {formData.regime === 'real' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Despesas Dedutíveis (R$)</label>
                  <input
                    type="number"
                    value={formData.expenses}
                    onChange={(e) => setFormData({ ...formData, expenses: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 300000"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total de Impostos</p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    {formatCurrency(calculateTaxes.taxes.total)}
                  </p>
                </div>
                <Receipt className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Receita Líquida</p>
                  <p className="text-2xl font-bold text-green-900 mt-2">
                    {formatCurrency(calculateTaxes.netIncome)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Carga Tributária</p>
                  <p className="text-2xl font-bold text-purple-900 mt-2">
                    {formatPercentage(calculateTaxes.effectiveRate)}
                  </p>
                </div>
                <Percent className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Detalhamento dos Impostos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Detalhamento dos Impostos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">IRPJ</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(calculateTaxes.taxes.irpj)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">CSLL</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(calculateTaxes.taxes.csll)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">PIS</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(calculateTaxes.taxes.pis)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">COFINS</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(calculateTaxes.taxes.cofins)}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">ICMS</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(calculateTaxes.taxes.icms)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">ISS</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(calculateTaxes.taxes.iss)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">CPP</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(calculateTaxes.taxes.cpp)}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-blue-100 rounded-lg border border-blue-200">
                  <span className="text-sm font-bold text-blue-900">TOTAL</span>
                  <span className="text-sm font-bold text-blue-900">{formatCurrency(calculateTaxes.taxes.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparação de Regimes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Comparação de Regimes Tributários</h3>
            
            <div className="space-y-4">
              {regimeComparison.map((comparison, index) => (
                <div key={comparison.regime} className={`p-4 rounded-lg border-2 ${
                  index === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {comparison.regime === 'simples' ? 'Simples Nacional' : 
                         comparison.regime === 'presumido' ? 'Lucro Presumido' : 'Lucro Real'}
                        {index === 0 && <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Melhor opção</span>}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Carga tributária: {formatPercentage(comparison.effectiveRate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(comparison.totalTax)}</p>
                      <p className="text-sm text-gray-600">Líquido: {formatCurrency(comparison.netIncome)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}