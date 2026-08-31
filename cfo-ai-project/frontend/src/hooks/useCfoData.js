import { useQuery } from 'react-query'
import { endpoints } from '../services/cfoApi'

export const useDashboard = () => {
  return useQuery('dashboard', endpoints.dashboard, {
    refetchInterval: 5 * 60 * 1000, // Refetch cada 5 minutos
  })
}

export const useTesoreriaPosicion = () => {
  return useQuery('tesoreria-posicion', endpoints.tesoreria.posicion)
}

export const useTesoreriaCxC = () => {
  return useQuery('tesoreria-cxc', endpoints.tesoreria.cxc)
}

export const useTesoreriaCxP = () => {
  return useQuery('tesoreria-cxp', endpoints.tesoreria.cxp)
}

export const useTesoreriaProyeccion = (semanas = 13) => {
  return useQuery(['tesoreria-proyeccion', semanas], () => 
    endpoints.tesoreria.proyeccion(semanas)
  )
}

export const useAlertas = () => {
  return useQuery('alertas', endpoints.alertas, {
    refetchInterval: 60 * 1000, // Refetch cada minuto
  })
}

export const useInsights = (context = 'all') => {
  return useQuery(['insights', context], () => endpoints.analisis.insights(context), {
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  })
}

export const useInsightsHistorico = (options = {}) => {
  const { limit = 50, type, severity, days = 30 } = options
  return useQuery(
    ['insights-historico', limit, type, severity, days],
    () => endpoints.analisis.insightsHistorico({ limit, type, severity, days }),
    {
      refetchInterval: 10 * 60 * 1000,
    }
  )
}

export const useAgentesLogs = (options = {}) => {
  const { limit = 50, agente, categoria, status, dias = 7 } = options
  return useQuery(
    ['agentes-logs', limit, agente, categoria, status, dias],
    () => endpoints.agents.logs({ limit, agente, categoria, status, dias }),
    {
      refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
    }
  )
}

export const useWorkingCapital = (options = {}) => {
  const { empresaId = 1, meses = 6 } = options
  return useQuery(
    ['working-capital', empresaId, meses],
    () => endpoints.analisis.workingCapital({ empresa_id: empresaId, meses }),
    {
      refetchInterval: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    }
  )
}

export const useRatiosFinancieros = (options = {}) => {
  const { empresaId = 1, fecha } = options
  return useQuery(
    ['ratios-financieros', empresaId, fecha],
    () => endpoints.reportes.ratios({ empresa_id: empresaId, fecha_hasta: fecha }),
    {
      refetchInterval: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    }
  )
}

// ============================================
// MÁRGENES - Con soporte para filtros multi-dimensión
// ============================================

export const useMargenes = (filters = {}) => {
  const { marca_id, tienda_id, pais_id } = filters
  return useQuery(
    ['margenes', marca_id, tienda_id, pais_id],
    () => endpoints.margenes.resumen(filters),
    {
      refetchInterval: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    }
  )
}

export const useMargenProductoDetalle = (id) => {
  return useQuery(['margen-producto-detalle', id], () => 
    endpoints.margenes.detalleProducto(id),
    { enabled: !!id }
  )
}

export const useMargenVendedores = (filters = {}) => {
  const { marca_id, tienda_id, pais_id } = filters
  return useQuery(
    ['margen-vendedores', marca_id, tienda_id, pais_id],
    () => endpoints.margenes.vendedores(filters),
    {
      refetchInterval: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    }
  )
}

export const useMargenClientes = (filters = {}) => {
  const { marca_id, tienda_id, pais_id } = filters
  return useQuery(
    ['margen-clientes', marca_id, tienda_id, pais_id],
    () => endpoints.margenes.clientes(filters),
    {
      refetchInterval: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    }
  )
}

export const useMargenLineas = (filters = {}) => {
  const { marca_id, tienda_id, pais_id } = filters
  return useQuery(
    ['margen-lineas', marca_id, tienda_id, pais_id],
    () => endpoints.margenes.lineas(filters),
    {
      refetchInterval: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    }
  )
}

// Nuevos hooks para multi-marca
export const useMargenMarcas = (filters = {}) => {
  const { tienda_id, pais_id } = filters
  return useQuery(
    ['margen-marcas', tienda_id, pais_id],
    () => endpoints.margenes.marcas(filters),
    {
      refetchInterval: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    }
  )
}

export const useMargenTiendas = (filters = {}) => {
  const { marca_id, pais_id } = filters
  return useQuery(
    ['margen-tiendas', marca_id, pais_id],
    () => endpoints.margenes.tiendas(filters),
    {
      refetchInterval: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    }
  )
}

export const useMargenPaises = (filters = {}) => {
  const { marca_id, tienda_id } = filters
  return useQuery(
    ['margen-paises', marca_id, tienda_id],
    () => endpoints.margenes.paises(filters),
    {
      refetchInterval: 5 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    }
  )
}

export const useMargenCatalogos = () => {
  return useQuery(
    'margen-catalogos',
    endpoints.margenes.catalogos,
    {
      refetchInterval: 30 * 60 * 1000, // 30 minutos, no cambian mucho
      staleTime: 15 * 60 * 1000,
    }
  )
}
