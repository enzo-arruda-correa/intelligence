import React, { useState } from 'react'
import { TrendingUp, Search, MousePointer, Eye, Users, DollarSign } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface SEOMetrics {
  keywords: string
  organicTraffic: number
  clickThroughRate: number
  averagePosition: number
  impressions: number
  clicks: number
}

interface SEMMetrics {
  campaignName: string
  budget: number
  impressions: number
  clicks: number
  conversions: number
  cost: number
  ctr: number
  cpc: number
  conversionRate: number
  roas: number
}

export function MarketingAnalysis() {
  const [activeTab, setActiveTab] = useState<'seo' | 'sem' | 'social' | 'email'>('seo')
  
  // SEO State
  const [seoMetrics, setSeoMetrics] = useState<SEOMetrics[]>([])
  const [seoForm, setSeoForm] = useState({
    keywords: '',
    organicTraffic: '',
    clickThroughRate: '',
    averagePosition: '',
    impressions: '',
    clicks: ''
  })

  // SEM State
  const [semMetrics, setSemMetrics] = useState<SEMMetrics[]>([])
  const [semForm, setSemForm] = useState({
    campaignName: '',
    budget: '',
    impressions: '',
    clicks: '',
    conversions: '',
    cost: ''
  })

  // Social Media State
  const [socialMetrics, setSocialMetrics] = useState<any[]>([])
  const [socialForm, setSocialForm] = useState({
    platform: 'facebook',
    followers: '',
    engagement: '',
    reach: '',
    impressions: '',
    clicks: ''
  })

  // Email Marketing State
  const [emailMetrics, setEmailMetrics] = useState<any[]>([])
  const [emailForm, setEmailForm] = useState({
    campaignName: '',
    sent: '',
    delivered: '',
    opened: '',
    clicked: '',
    conversions: ''
  })

  const addSEOMetric = () => {
    if (seoForm.keywords && seoForm.organicTraffic) {
      const newMetric: SEOMetrics = {
        keywords: seoForm.keywords,
        organicTraffic: parseInt(seoForm.organicTraffic),
        clickThroughRate: parseFloat(seoForm.clickThroughRate) || 0,
        averagePosition: parseFloat(seoForm.averagePosition) || 0,
        impressions: parseInt(seoForm.impressions) || 0,
        clicks: parseInt(seoForm.clicks) || 0
      }
      setSeoMetrics([...seoMetrics, newMetric])
      setSeoForm({
        keywords: '',
        organicTraffic: '',
        clickThroughRate: '',
        averagePosition: '',
        impressions: '',
        clicks: ''
      })
    }
  }

  const addSEMMetric = () => {
    if (semForm.campaignName && semForm.budget) {
      const impressions = parseInt(semForm.impressions) || 0
      const clicks = parseInt(semForm.clicks) || 0
      const conversions = parseInt(semForm.conversions) || 0
      const cost = parseFloat(semForm.cost) || 0
      
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
      const cpc = clicks > 0 ? cost / clicks : 0
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0
      const revenue = conversions * 50 // Mock average order value
      const roas = cost > 0 ? (revenue / cost) * 100 : 0

      const newMetric: SEMMetrics = {
        campaignName: semForm.campaignName,
        budget: parseFloat(semForm.budget),
        impressions,
        clicks,
        conversions,
        cost,
        ctr,
        cpc,
        conversionRate,
        roas
      }
      setSemMetrics([...semMetrics, newMetric])
      setSemForm({
        campaignName: '',
        budget: '',
        impressions: '',
        clicks: '',
        conversions: '',
        cost: ''
      })
    }
  }

  const addSocialMetric = () => {
    if (socialForm.platform && socialForm.followers) {
      const followers = parseInt(socialForm.followers)
      const engagement = parseInt(socialForm.engagement) || 0
      const reach = parseInt(socialForm.reach) || 0
      const impressions = parseInt(socialForm.impressions) || 0
      const clicks = parseInt(socialForm.clicks) || 0
      
      const engagementRate = followers > 0 ? (engagement / followers) * 100 : 0
      const reachRate = followers > 0 ? (reach / followers) * 100 : 0
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0

      const newMetric = {
        platform: socialForm.platform,
        followers,
        engagement,
        reach,
        impressions,
        clicks,
        engagementRate,
        reachRate,
        ctr
      }
      setSocialMetrics([...socialMetrics, newMetric])
      setSocialForm({
        platform: 'facebook',
        followers: '',
        engagement: '',
        reach: '',
        impressions: '',
        clicks: ''
      })
    }
  }

  const addEmailMetric = () => {
    if (emailForm.campaignName && emailForm.sent) {
      const sent = parseInt(emailForm.sent)
      const delivered = parseInt(emailForm.delivered) || sent
      const opened = parseInt(emailForm.opened) || 0
      const clicked = parseInt(emailForm.clicked) || 0
      const conversions = parseInt(emailForm.conversions) || 0
      
      const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0
      const openRate = delivered > 0 ? (opened / delivered) * 100 : 0
      const clickRate = opened > 0 ? (clicked / opened) * 100 : 0
      const conversionRate = clicked > 0 ? (conversions / clicked) * 100 : 0

      const newMetric = {
        campaignName: emailForm.campaignName,
        sent,
        delivered,
        opened,
        clicked,
        conversions,
        deliveryRate,
        openRate,
        clickRate,
        conversionRate
      }
      setEmailMetrics([...emailMetrics, newMetric])
      setEmailForm({
        campaignName: '',
        sent: '',
        delivered: '',
        opened: '',
        clicked: '',
        conversions: ''
      })
    }
  }

  const tabs = [
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'sem', label: 'SEM/PPC', icon: MousePointer },
    { id: 'social', label: 'Redes Sociais', icon: Users },
    { id: 'email', label: 'Email Marketing', icon: Eye }
  ]

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Análise de Marketing</h1>
        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* SEO Tab */}
      {activeTab === 'seo' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Adicionar Métricas de SEO</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Palavra-chave
                </label>
                <input
                  type="text"
                  value={seoForm.keywords}
                  onChange={(e) => setSeoForm({...seoForm, keywords: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="marketing digital"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Tráfego Orgânico
                </label>
                <input
                  type="number"
                  value={seoForm.organicTraffic}
                  onChange={(e) => setSeoForm({...seoForm, organicTraffic: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="1500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  CTR (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={seoForm.clickThroughRate}
                  onChange={(e) => setSeoForm({...seoForm, clickThroughRate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="3.5"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Posição Média
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={seoForm.averagePosition}
                  onChange={(e) => setSeoForm({...seoForm, averagePosition: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="5.2"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Impressões
                </label>
                <input
                  type="number"
                  value={seoForm.impressions}
                  onChange={(e) => setSeoForm({...seoForm, impressions: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Cliques
                </label>
                <input
                  type="number"
                  value={seoForm.clicks}
                  onChange={(e) => setSeoForm({...seoForm, clicks: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="1750"
                />
              </div>
            </div>
            <button
              onClick={addSEOMetric}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Adicionar Métrica
            </button>
          </div>

          {seoMetrics.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Métricas de SEO</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm min-w-[600px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 text-left">Palavra-chave</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Tráfego</th>
                      <th className="px-2 sm:px-4 py-2 text-left">CTR</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Posição</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Impressões</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Cliques</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {seoMetrics.map((metric, index) => (
                      <tr key={index}>
                        <td className="px-2 sm:px-4 py-2 font-medium max-w-[100px] truncate">{metric.keywords}</td>
                        <td className="px-2 sm:px-4 py-2">{metric.organicTraffic.toLocaleString()}</td>
                        <td className="px-2 sm:px-4 py-2">{metric.clickThroughRate.toFixed(2)}%</td>
                        <td className="px-2 sm:px-4 py-2">{metric.averagePosition.toFixed(1)}</td>
                        <td className="px-2 sm:px-4 py-2">{metric.impressions.toLocaleString()}</td>
                        <td className="px-2 sm:px-4 py-2">{metric.clicks.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEM Tab */}
      {activeTab === 'sem' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Adicionar Campanha SEM/PPC</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  value={semForm.campaignName}
                  onChange={(e) => setSemForm({...semForm, campaignName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Campanha Google Ads"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Orçamento (R$)
                </label>
                <input
                  type="number"
                  value={semForm.budget}
                  onChange={(e) => setSemForm({...semForm, budget: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Impressões
                </label>
                <input
                  type="number"
                  value={semForm.impressions}
                  onChange={(e) => setSemForm({...semForm, impressions: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Cliques
                </label>
                <input
                  type="number"
                  value={semForm.clicks}
                  onChange={(e) => setSemForm({...semForm, clicks: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="2500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Conversões
                </label>
                <input
                  type="number"
                  value={semForm.conversions}
                  onChange={(e) => setSemForm({...semForm, conversions: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="125"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Custo Total (R$)
                </label>
                <input
                  type="number"
                  value={semForm.cost}
                  onChange={(e) => setSemForm({...semForm, cost: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="4500"
                />
              </div>
            </div>
            <button
              onClick={addSEMMetric}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Adicionar Campanha
            </button>
          </div>

          {semMetrics.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Total Investido</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 break-all">
                        R$ {semMetrics.reduce((sum, m) => sum + m.cost, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Total Cliques</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        {semMetrics.reduce((sum, m) => sum + m.clicks, 0).toLocaleString()}
                      </p>
                    </div>
                    <MousePointer className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Total Conversões</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        {semMetrics.reduce((sum, m) => sum + m.conversions, 0).toLocaleString()}
                      </p>
                    </div>
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 flex-shrink-0" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">ROAS Médio</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        {semMetrics.length > 0 ? (semMetrics.reduce((sum, m) => sum + m.roas, 0) / semMetrics.length).toFixed(0) : 0}%
                      </p>
                    </div>
                    <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0" />
                  </div>
                </div>
              </div>

              {/* Campaigns Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Campanhas SEM/PPC</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm min-w-[900px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 text-left">Campanha</th>
                        <th className="px-2 sm:px-4 py-2 text-left">Orçamento</th>
                        <th className="px-2 sm:px-4 py-2 text-left">Impressões</th>
                        <th className="px-2 sm:px-4 py-2 text-left">Cliques</th>
                        <th className="px-2 sm:px-4 py-2 text-left">CTR</th>
                        <th className="px-2 sm:px-4 py-2 text-left">CPC</th>
                        <th className="px-2 sm:px-4 py-2 text-left">Conversões</th>
                        <th className="px-2 sm:px-4 py-2 text-left">Taxa Conv.</th>
                        <th className="px-2 sm:px-4 py-2 text-left">ROAS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {semMetrics.map((metric, index) => (
                        <tr key={index}>
                          <td className="px-2 sm:px-4 py-2 font-medium max-w-[120px] truncate">{metric.campaignName}</td>
                          <td className="px-2 sm:px-4 py-2">R$ {metric.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          <td className="px-2 sm:px-4 py-2">{metric.impressions.toLocaleString()}</td>
                          <td className="px-2 sm:px-4 py-2">{metric.clicks.toLocaleString()}</td>
                          <td className="px-2 sm:px-4 py-2">{metric.ctr.toFixed(2)}%</td>
                          <td className="px-2 sm:px-4 py-2">R$ {metric.cpc.toFixed(2)}</td>
                          <td className="px-2 sm:px-4 py-2">{metric.conversions}</td>
                          <td className="px-2 sm:px-4 py-2">{metric.conversionRate.toFixed(2)}%</td>
                          <td className="px-2 sm:px-4 py-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              metric.roas > 200 ? 'bg-green-100 text-green-800' :
                              metric.roas > 100 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {metric.roas.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Social Media Tab */}
      {activeTab === 'social' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Adicionar Métricas de Redes Sociais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Plataforma
                </label>
                <select
                  value={socialForm.platform}
                  onChange={(e) => setSocialForm({...socialForm, platform: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Seguidores
                </label>
                <input
                  type="number"
                  value={socialForm.followers}
                  onChange={(e) => setSocialForm({...socialForm, followers: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="10000"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Engajamento
                </label>
                <input
                  type="number"
                  value={socialForm.engagement}
                  onChange={(e) => setSocialForm({...socialForm, engagement: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Alcance
                </label>
                <input
                  type="number"
                  value={socialForm.reach}
                  onChange={(e) => setSocialForm({...socialForm, reach: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="8000"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Impressões
                </label>
                <input
                  type="number"
                  value={socialForm.impressions}
                  onChange={(e) => setSocialForm({...socialForm, impressions: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="15000"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Cliques
                </label>
                <input
                  type="number"
                  value={socialForm.clicks}
                  onChange={(e) => setSocialForm({...socialForm, clicks: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="300"
                />
              </div>
            </div>
            <button
              onClick={addSocialMetric}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Adicionar Métrica
            </button>
          </div>

          {socialMetrics.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Métricas de Redes Sociais</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm min-w-[700px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 text-left">Plataforma</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Seguidores</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Engajamento</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Taxa Eng.</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Alcance</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Taxa Alcance</th>
                      <th className="px-2 sm:px-4 py-2 text-left">CTR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {socialMetrics.map((metric, index) => (
                      <tr key={index}>
                        <td className="px-2 sm:px-4 py-2 font-medium capitalize">{metric.platform}</td>
                        <td className="px-2 sm:px-4 py-2">{metric.followers.toLocaleString()}</td>
                        <td className="px-2 sm:px-4 py-2">{metric.engagement.toLocaleString()}</td>
                        <td className="px-2 sm:px-4 py-2">{metric.engagementRate.toFixed(2)}%</td>
                        <td className="px-2 sm:px-4 py-2">{metric.reach.toLocaleString()}</td>
                        <td className="px-2 sm:px-4 py-2">{metric.reachRate.toFixed(2)}%</td>
                        <td className="px-2 sm:px-4 py-2">{metric.ctr.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Email Marketing Tab */}
      {activeTab === 'email' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Adicionar Campanha de Email</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  value={emailForm.campaignName}
                  onChange={(e) => setEmailForm({...emailForm, campaignName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Newsletter Mensal"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Emails Enviados
                </label>
                <input
                  type="number"
                  value={emailForm.sent}
                  onChange={(e) => setEmailForm({...emailForm, sent: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Emails Entregues
                </label>
                <input
                  type="number"
                  value={emailForm.delivered}
                  onChange={(e) => setEmailForm({...emailForm, delivered: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="4850"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Emails Abertos
                </label>
                <input
                  type="number"
                  value={emailForm.opened}
                  onChange={(e) => setEmailForm({...emailForm, opened: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="1200"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Cliques
                </label>
                <input
                  type="number"
                  value={emailForm.clicked}
                  onChange={(e) => setEmailForm({...emailForm, clicked: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="180"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Conversões
                </label>
                <input
                  type="number"
                  value={emailForm.conversions}
                  onChange={(e) => setEmailForm({...emailForm, conversions: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="25"
                />
              </div>
            </div>
            <button
              onClick={addEmailMetric}
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Adicionar Campanha
            </button>
          </div>

          {emailMetrics.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Campanhas de Email Marketing</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm min-w-[700px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 text-left">Campanha</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Enviados</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Taxa Entrega</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Taxa Abertura</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Taxa Clique</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Conversões</th>
                      <th className="px-2 sm:px-4 py-2 text-left">Taxa Conv.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {emailMetrics.map((metric, index) => (
                      <tr key={index}>
                        <td className="px-2 sm:px-4 py-2 font-medium max-w-[120px] truncate">{metric.campaignName}</td>
                        <td className="px-2 sm:px-4 py-2">{metric.sent.toLocaleString()}</td>
                        <td className="px-2 sm:px-4 py-2">{metric.deliveryRate.toFixed(2)}%</td>
                        <td className="px-2 sm:px-4 py-2">{metric.openRate.toFixed(2)}%</td>
                        <td className="px-2 sm:px-4 py-2">{metric.clickRate.toFixed(2)}%</td>
                        <td className="px-2 sm:px-4 py-2">{metric.conversions}</td>
                        <td className="px-2 sm:px-4 py-2">{metric.conversionRate.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}