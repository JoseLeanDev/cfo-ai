import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  BanknotesIcon,
  BookOpenIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  BellIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import AgentChat from '../agents/AgentChat'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Tesorería', href: '/tesoreria', icon: BanknotesIcon },
  { name: 'Contabilidad', href: '/contabilidad', icon: BookOpenIcon },
  { name: 'Análisis', href: '/analisis', icon: ChartBarIcon },
  { name: 'SAT', href: '/sat', icon: DocumentCheckIcon },
  { name: 'Log de Actividades', href: '/log-actividades', icon: CpuChipIcon },
]

export default function DashboardLayout({ children }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl animate-slide-up">
            <div className="flex h-20 items-center justify-between px-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gradient">CFO AI</span>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={isActive ? 'nav-link-active' : 'nav-link'}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white/80 backdrop-blur-xl border-r border-slate-200/60">
          <div className="flex items-center h-20 px-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient">CFO AI</span>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={isActive ? 'nav-link-active' : 'nav-link'}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          
          {/* User section */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">AD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">Admin DICSA</p>
                <p className="text-xs text-slate-500 truncate">CFO</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
          <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-400 lg:hidden hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4">
              <button className="relative p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
              </button>
              
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium ring-1 ring-emerald-600/20">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Sistema operativo
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Agent Chat - Available everywhere */}
      <AgentChat />
    </div>
  )
}
