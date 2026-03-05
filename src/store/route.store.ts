import { create } from 'zustand'
import type { RouteInfo } from '../types'

interface RouteState {
  route: RouteInfo | null
  isLoading: boolean
  isTracking: boolean
  destination: [number, number] | null
  error: string | null
  setRoute: (route: RouteInfo) => void
  clearRoute: () => void
  setError: (error: string | null) => void
  fetchRoute: (origin: [number, number], destination: [number, number], tracking?: boolean) => Promise<void>
}

export const useRouteStore = create<RouteState>((set) => ({
  route: null,
  isLoading: false,
  isTracking: false,
  destination: null,
  error: null,
  setRoute: (route) => set({ route, error: null }),
  clearRoute: () => set({ route: null, error: null, isLoading: false, isTracking: false, destination: null }),
  setError: (error) => set({ error, isLoading: false }),
  fetchRoute: async (origin, destination, tracking = false) => {
    set({ isLoading: true, error: null, destination, isTracking: tracking })
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Falha ao buscar rota')
      const data = await res.json()
      if (data.code !== 'Ok' || !data.routes?.length) {
        throw new Error('Rota não encontrada')
      }
      const osrmRoute = data.routes[0]
      const geometry: [number, number][] = osrmRoute.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      )
      set({
        route: { geometry, distance: osrmRoute.distance, duration: osrmRoute.duration, origin, destination },
        isLoading: false,
        error: null,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        isLoading: false,
      })
    }
  },
}))
