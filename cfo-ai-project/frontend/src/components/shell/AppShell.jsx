import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { navigation, findDestination } from '../../config/navigation'
import { QoraWordmark, QoraMark } from '../brand/QoraLogo'
import CommandPalette from './CommandPalette'
import AgentPanel from '../agents/AgentPanel'
import { Eyebrow } from '../ui'
import { ErrorBoundary } from '../ui/states'

const CLIENTE = import.meta.env.VITE_CLIENTE_NOMBRE || 'Cliente'
const REGION = import.meta.env.VITE_CLIENTE_REGION || ''

/* -------------------------------------------------------------------------- */

function NavItem({ item, pathname, onNavigate }) {
  const active = item.end ? pathname === item.href : pathname === item.href
  const childActive = (item.children ?? []).some((c) => c.href === pathname)
  const expanded = active || childActive

  return (
    <li>
      <Link
        to={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={active ? 'nav-link-active' : 'nav-link'}
      >
        <item.icon className="h-[18px] w-[18px] shrink-0" />
        <span className="truncate">{item.name}</span>
        {item.agent ? (
          <span className="status-dot agent ml-auto shrink-0" title="Agentes activos" />
        ) : null}
      </Link>

      {/* Las pantallas de detalle solo se despliegan dentro de su sección, para
          que la barra no crezca a 21 entradas planas. */}
      {expanded && item.children?.length ? (
        <ul className="mb-1 ml-[26px] border-l border-fog">
          {item.children.map((child) => {
            const childIsActive = pathname === child.href
            return (
              <li key={child.href}>
                <Link
                  to={child.href}
                  onClick={onNavigate}
                  aria-current={childIsActive ? 'page' : undefined}
                  className={`-ml-px flex items-center gap-2 border-l-2 py-1.5 pl-3 pr-2 text-[0.8125rem] transition-colors ${
                    childIsActive
                      ? 'border-ink font-medium text-ink'
                      : 'border-transparent text-slate hover:text-ink'
                  }`}
                >
                  <span className="truncate">{child.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : null}
    </li>
  )
}

function SidebarContent({ pathname, isAdmin, user, onNavigate, onLogout }) {
  const initials = (user?.nombre || 'Usuario')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Identidad. El espacio libre alrededor del logotipo equivale a la
          altura de caja del propio wordmark (1×Q). */}
      <div className="border-b border-fog px-6 py-5">
        <Link to="/" onClick={onNavigate} className="block" aria-label="Qora — inicio">
          <QoraWordmark className="h-5 w-auto text-ink" />
        </Link>
      </div>

      {/* Contexto del cliente: una sola línea, no una caja con dos selectores
          decorativos que no filtran nada. */}
      <div className="border-b border-fog px-6 py-4">
        <Eyebrow className="mb-1.5 text-[0.6875rem]">Instancia</Eyebrow>
        <p className="truncate text-[0.875rem] font-medium leading-tight text-ink">
          {CLIENTE}
        </p>
        {REGION ? (
          <p className="mt-0.5 truncate text-[0.8125rem] text-slate">{REGION}</p>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto py-4" aria-label="Principal">
        {navigation.map((section, index) => {
          const items = section.items.filter((i) => !i.adminOnly || isAdmin)
          if (items.length === 0) return null
          return (
            <div key={section.group ?? `s-${index}`} className={index > 0 ? 'mt-6' : ''}>
              {section.group ? (
                <Eyebrow className="mb-2 px-6 text-[0.6875rem]">{section.group}</Eyebrow>
              ) : null}
              <ul className="px-3">
                {items.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-fog px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-ink font-mono text-[0.6875rem] text-white">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.875rem] font-medium leading-tight text-ink">
              {user?.nombre || 'Usuario'}
            </p>
            <p className="truncate text-[0.8125rem] text-slate">
              {isAdmin ? 'Administrador' : user?.rol || 'Usuario'}
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            className="shrink-0 rounded-control p-1.5 text-slate transition-colors hover:bg-paper hover:text-ink"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

export default function AppShell({ children }) {
  const { pathname } = useLocation()
  const { user, logout, isAdmin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)

  const destination = findDestination(pathname)

  // ⌘K / Ctrl+K abre la paleta desde cualquier pantalla.
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Cerrar el cajón móvil al cambiar de ruta.
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const openAgent = useCallback(() => setAgentOpen(true), [])

  return (
    <div className="min-h-screen bg-paper">
      {/* Salto al contenido: la barra lateral tiene ~25 enlaces. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>

      {/* Barra lateral — escritorio */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-fog">
        <SidebarContent
          pathname={pathname}
          isAdmin={isAdmin}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {/* Barra lateral — móvil */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-ink/30"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 border-r border-fog shadow-overlay">
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Cerrar navegación"
              className="absolute right-3 top-4 z-10 rounded-control p-1.5 text-slate hover:bg-paper hover:text-ink"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <SidebarContent
              pathname={pathname}
              isAdmin={isAdmin}
              user={user}
              onNavigate={() => setSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        {/* Barra superior: ruta real + búsqueda + acción de agente. Se retiran
            las insignias decorativas ("4 marcas / 17 tiendas") que no
            reflejaban estado ni filtraban nada. */}
        <header className="sticky top-0 z-30 border-b border-fog bg-white">
          <div className="mx-auto flex h-14 max-w-shell items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir navegación"
              className="-ml-1.5 rounded-control p-1.5 text-slate hover:bg-paper hover:text-ink lg:hidden"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            <Link to="/" className="lg:hidden" aria-label="Qora — inicio">
              <QoraMark className="h-5 w-5 text-ink" />
            </Link>

            <nav aria-label="Ruta" className="hidden min-w-0 items-center gap-2 sm:flex">
              <Link to="/" className="shrink-0 text-[0.8125rem] text-slate hover:text-ink">
                {CLIENTE}
              </Link>
              {destination?.parent ? (
                <>
                  <ChevronRightIcon className="h-3 w-3 shrink-0 text-mist" />
                  <Link
                    to={destination.parent.href}
                    className="shrink-0 text-[0.8125rem] text-slate hover:text-ink"
                  >
                    {destination.parent.name}
                  </Link>
                </>
              ) : null}
              <ChevronRightIcon className="h-3 w-3 shrink-0 text-mist" />
              <span className="truncate text-[0.8125rem] font-medium text-ink">
                {destination?.name ?? 'Resumen'}
              </span>
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setPaletteOpen(true)}
                className="flex items-center gap-2 rounded-control border border-fog px-2.5 py-1.5 text-slate transition-colors hover:border-mist hover:text-ink"
                aria-label="Buscar (Command K)"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span className="hidden text-[0.8125rem] md:inline">Buscar</span>
                <kbd className="hidden rounded-control border border-fog px-1 font-mono text-[0.6875rem] md:inline">
                  ⌘K
                </kbd>
              </button>

              <button onClick={openAgent} className="btn-agent btn-sm">
                <span className="hidden sm:inline">Instruir a un agente</span>
                <span className="sm:hidden">Agente</span>
              </button>
            </div>
          </div>
        </header>

        {/* La medida del contenido se limita: sin tope, las tablas se estiran a
            todo el ancho del monitor y las cifras se separan de su etiqueta. */}
        <main
          id="contenido"
          className="mx-auto max-w-shell animate-fade-in px-4 py-8 sm:px-6 lg:px-8"
        >
          {/* La frontera envuelve el contenido, no el marco: si una pantalla
              falla, la navegación sigue en pie. La clave por ruta la reinicia
              al cambiar de pantalla. */}
          <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        isAdmin={isAdmin}
        onBriefAgent={openAgent}
      />
      <AgentPanel open={agentOpen} onClose={() => setAgentOpen(false)} />
    </div>
  )
}
