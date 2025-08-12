import React from 'react'
import { 
  BarChart3, 
  Package, 
  Calculator, 
  TrendingUp, 
  Home,
  LogOut
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface SidebarProps {
  activeMenu: string
  onMenuChange: (menu: string) => void
}

export function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  const { signOut, user, profile } = useAuth()

  const displayName = (profile?.name || user?.email?.split('@')[0] || 'Usuário')
  const role = profile?.role || 'Membro'
  const avatarUrl = profile?.avatar_url
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'sales', label: 'Análise de Vendas', icon: BarChart3 },
    { id: 'products', label: 'Análise de Produtos', icon: Package },
    { id: 'investments', label: 'Cálculos de Investimento', icon: Calculator },
    { id: 'marketing', label: 'Análise de Marketing', icon: TrendingUp },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <img 
          src="/13-removebg-preview (1).png" 
          alt="Logo" 
          className="h-12 w-auto"
        />
      </div>

      {/* User Header */}
      <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
            {initials}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-800">{displayName}</span>
          <span className="text-xs text-gray-500">{role}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  onClick={() => onMenuChange(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    activeMenu === item.id
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-4 py-3 text-left rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </button>
      </div>
    </div>
  )
}