import {
  HomeIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  TruckIcon,
  ShoppingCartIcon,
  CalculatorIcon,
  BanknotesIcon,
  DocumentTextIcon,
  BookOpenIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  DocumentCheckIcon,
  CpuChipIcon,
  UsersIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  PresentationChartLineIcon,
  SparklesIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline'

/**
 * Navegación de la aplicación.
 *
 * El diseño anterior exponía 9 destinos en la barra lateral mientras el router
 * servía 21: las demás pantallas solo eran alcanzables por enlace profundo.
 * Aquí toda ruta con página tiene una entrada, agrupada por dominio, y las
 * pantallas de detalle cuelgan de su sección como `children`.
 */
export const navigation = [
  {
    group: null,
    items: [{ name: 'Resumen', href: '/', icon: HomeIcon, end: true }],
  },
  {
    group: 'Operación',
    items: [
      { name: 'Ventas', href: '/ventas', icon: CurrencyDollarIcon,
        children: [
          { name: 'Historial de ventas', href: '/compras/historial-ventas', icon: ClockIcon },
        ],
      },
      { name: 'Márgenes', href: '/margenes', icon: ArrowTrendingUpIcon },
      { name: 'Producción', href: '/produccion', icon: TruckIcon },
      { name: 'Compras', href: '/compras', icon: ShoppingCartIcon },
      { name: 'Gastos operativos', href: '/gastos-operativos', icon: CalculatorIcon },
    ],
  },
  {
    group: 'Tesorería',
    items: [
      {
        name: 'Tesorería',
        href: '/tesoreria',
        icon: BanknotesIcon,
        children: [
          { name: 'Cuentas por cobrar', href: '/tesoreria/cuentas-por-cobrar', icon: DocumentTextIcon },
          { name: 'Cuentas por pagar', href: '/tesoreria/cuentas-por-pagar', icon: CreditCardIcon },
          { name: 'Cuentas bancarias', href: '/tesoreria/cuentas-bancarias', icon: BuildingLibraryIcon },
          { name: 'Proyecciones', href: '/tesoreria/proyecciones', icon: PresentationChartLineIcon },
        ],
      },
    ],
  },
  {
    group: 'Registro',
    items: [
      {
        name: 'Contabilidad',
        href: '/contabilidad',
        icon: BookOpenIcon,
        children: [
          { name: 'Libro diario', href: '/contabilidad/libro-diario', icon: DocumentTextIcon },
          { name: 'Cierre mensual', href: '/contabilidad/cierre', icon: CheckBadgeIcon },
        ],
      },
      { name: 'SAT', href: '/sat', icon: DocumentCheckIcon },
    ],
  },
  {
    group: 'Inteligencia',
    items: [
      { name: 'Asistente', href: '/asistente', icon: ChatBubbleBottomCenterTextIcon, agent: true },
      { name: 'Insights de IA', href: '/insights', icon: SparklesIcon },
      { name: 'Reportes', href: '/reportes', icon: DocumentChartBarIcon },
      { name: 'Agentes', href: '/agentes', icon: CpuChipIcon },
    ],
  },
  {
    group: 'Administración',
    items: [{ name: 'Usuarios', href: '/usuarios', icon: UsersIcon, adminOnly: true }],
  },
]

/** Lista plana de todos los destinos, para breadcrumb y paleta de comandos. */
export const allDestinations = navigation.flatMap((section) =>
  section.items.flatMap((item) => [
    { ...item, group: section.group },
    ...(item.children ?? []).map((child) => ({
      ...child,
      group: section.group,
      parent: item,
    })),
  ])
)

export function findDestination(pathname) {
  return (
    allDestinations.find((d) => d.href === pathname) ??
    allDestinations
      .filter((d) => d.href !== '/' && pathname.startsWith(d.href))
      .sort((a, b) => b.href.length - a.href.length)[0] ??
    null
  )
}
