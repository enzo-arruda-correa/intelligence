import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Package, 
  Calculator, 
  TrendingUp, 
  Home,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface SidebarProps {
  activeMenu: string
  onMenuChange: (menu: string) => void
}

export function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  const { signOut, user, profile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (!mobile) {
        setIsOpen(false)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

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

  const handleMenuClick = (menuId: string) => {
    onMenuChange(menuId)
    if (isMobile) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 lg:hidden bg-white p-2 rounded-md shadow-lg border border-gray-200"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      )}

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
        w-64 bg-white shadow-lg h-screen flex flex-col transition-transform duration-300 ease-in-out z-50
        ${isMobile ? 'top-0 left-0' : ''}
      `}>
        {/* Logo */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <img 
            src="/13-removebg-preview (1).png" 
            alt="Logo" 
            className="h-8 sm:h-12 w-auto"
          />
        </div>

        {/* User Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center space-x-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">{displayName}</span>
            <span className="text-xs text-gray-500 truncate">{role}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <ul className="space-y-1 sm:space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center px-3 sm:px-4 py-2 sm:py-3 text-left rounded-lg transition-colors text-sm sm:text-base ${
                      activeMenu === item.id
                        ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sign Out */}
        <div className="p-3 sm:p-4 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 sm:px-4 py-2 sm:py-3 text-left rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  )
}