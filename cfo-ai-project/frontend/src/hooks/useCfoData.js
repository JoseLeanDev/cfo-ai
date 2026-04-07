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
