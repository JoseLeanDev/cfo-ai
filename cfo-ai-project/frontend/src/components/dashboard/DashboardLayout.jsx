import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  BanknotesIcon,
  BookOpenIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  CpuChipIcon,
  Squares2X2Icon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import AgentChat from '../agents/AgentChat'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Tesorería', href: '/tesoreria', icon: BanknotesIcon },
  { name: 'Contabilidad', href: '/contabilidad', icon: BookOpenIcon },
  { name: 'Análisis', href: '/analisis', icon: ChartBarIcon },
  { name: 'SAT', href: '/sat', icon: DocumentCheckIcon },
  { name: 'Agentes IA', href: '/log-actividades', icon: CpuChipIcon },
]

// Status indicator component
const StatusIndicator = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--success-dim)] text-[var(--success)] text-xs font-mono">
    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
    OPERATIVO
  </div>
)

export default function DashboardLayout({ children }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-GT', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-[var(--bg-secondary)] border-r border-[var(--border-default)] animate-slide-up">
            <div className="flex h-16 items-center justify-between px-5 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center shadow-lg shadow-[var(--accent-cyan-glow)]">
                  <SparklesIcon className="w-5 h-5 text-[var(--bg-primary)]" />
                </div>
                <div>
                  <span className="text-lg font-bold text-gradient-cyan tracking-tight">CFO AI</span>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono tracking-wider">ENTERPRISE</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
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
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-secondary)]'}`} />
                    <span className="text-sm">{item.name}</span>
                    {item.name === 'Agentes IA' && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-[var(--success)]" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar - Premium Financial Design */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-[var(--bg-secondary)] border-r border-[var(--border-default)]">
          {/* Logo Section */}
          <div className="flex items-center h-16 px-5 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-purple)] flex items-center justify-center shadow-lg shadow-[var(--accent-cyan-glow)]">
                <SparklesIcon className="w-5 h-5 text-[var(--bg-primary)]" />
              </div>
              <div>
                <span className="text-lg font-bold text-gradient-cyan tracking-tight">CFO AI</span>
                <p className="text-[10px] text-[var(--text-muted)] font-mono tracking-wider">ENTERPRISE</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Módulos
            </div>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={isActive ? 'nav-link-active' : 'nav-link'}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-secondary)]'}`} />
                  <span className="text-sm">{item.name}</span>
                  {item.name === 'Agentes IA' && (
                    <span className="ml-auto flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
          
          {/* Bottom Section - Status & Time */}
          <div className="p-4 border-t border-[var(--border-default)] space-y-3">
            <div className="flex items-center justify-between">
              <StatusIndicator />
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {formatTime(currentTime)}
              </span>
            </div>
            
            {/* User */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)]">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-blue)] flex items-center justify-center">
                <span className="text-white font-semibold text-xs">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">JoseLeanDev</p>
                <p className="text-xs text-[var(--text-muted)] truncate">Administrador</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header - Premium Financial */}
        <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-default)]">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 text-[var(--text-secondary)] lg:hidden hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              
              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <span className="font-mono text-xs text-[var(--accent-cyan)]">GT</span>
                <span>/</span>
                <span className="text-[var(--text-secondary)]">
                  {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Date Display */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)]">
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {currentTime.toLocaleDateString('es-GT', { 
                    weekday: 'short',
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              {/* Notifications */}
              <button className="relative p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-all">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--danger)] rounded-full ring-2 ring-[var(--bg-primary)]" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Agent Chat - Available everywhere */}
      <AgentChat />
    </div>
  )
}
