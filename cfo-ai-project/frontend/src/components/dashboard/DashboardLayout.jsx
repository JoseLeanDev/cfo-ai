import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  BanknotesIcon,
  BookOpenIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  CpuChipIcon,
  Bars3Icon,
  XMarkIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Tesorería', href: '/tesoreria', icon: BanknotesIcon },
  { name: 'Contabilidad', href: '/contabilidad', icon: BookOpenIcon },
  { name: 'Análisis', href: '/analisis', icon: ChartBarIcon },
  { name: 'SAT', href: '/sat', icon: DocumentCheckIcon },
  { name: 'Agentes IA', href: '/log-actividades', icon: CpuChipIcon },
]

export default function DashboardLayout({ children }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date) => {
    return date.toLocaleDateString('es-GT', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/20" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-[var(--border-default)]">
            <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-[var(--brand-navy)] flex items-center justify-center">
                  <span className="text-white font-serif font-bold text-sm">C</span>
                </div>
                <span className="font-serif font-semibold text-[var(--brand-navy)]">CFO AI</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2">
                <XMarkIcon className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            
            <nav className="p-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={isActive ? 'nav-link-active' : 'nav-link'}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-[var(--border-default)]">
          {/* Logo */}
          <div className="flex items-center h-16 px-5 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded bg-[var(--brand-navy)] flex items-center justify-center">
                <BuildingOfficeIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-serif font-bold text-lg text-[var(--brand-navy)]">CFO AI</span>
                <p className="text-[10px] text-[var(--text-muted)] tracking-wider">DICSA ENTERPRISE</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-0.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={isActive ? 'nav-link-active' : 'nav-link'}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                  {item.name === 'Agentes IA' && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--success)]"></span>
                  )}
                </Link>
              )
            })}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-[var(--border-default)]">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)]">
              <div className="w-8 h-8 rounded-full bg-[var(--brand-navy)] flex items-center justify-center">
                <span className="text-white text-xs font-semibold">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">JoseLeanDev</p>
                <p className="text-xs text-[var(--text-muted)]">Administrador</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-60">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[var(--border-default)]">
          <div className="flex items-center justify-between h-14 px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 text-[var(--text-secondary)] lg:hidden hover:text-[var(--text-primary)]"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-[var(--text-muted)]">GT</span>
                <span className="text-[var(--border-strong)]">/</span>
                <span className="text-[var(--text-primary)] font-medium">
                  {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-tertiary)]">
                <span className="text-xs text-[var(--text-muted)]">{formatDate(currentTime)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--success)]"></span>
                <span className="text-xs text-[var(--text-muted)] hidden sm:inline">Sistema operativo</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
