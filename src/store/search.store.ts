import { create } from 'zustand'
import type { Company, GeoArea, HeatmapCell, MapBounds, SearchFilters } from '../types'

interface FlyToTarget {
  center: [number, number]
  zoom: number
}

interface SearchState {
  filters: SearchFilters
  filteredCompanies: Company[]
  selectedCompany: Company | null
  showDetail: boolean
  heatmapCells: HeatmapCell[]
  mapBounds: MapBounds | null
  mapZoom: number
  flyToTarget: FlyToTarget | null
  setQuery: (query: string) => void
  setSegmentos: (segmentos: string[]) => void
  setCnaes: (cnaes: string[]) => void
  setUf: (uf: string) => void
  setMunicipio: (municipio: string) => void
  setArea: (area: GeoArea | null) => void
  clearFilters: () => void
  setFilteredCompanies: (companies: Company[]) => void
  setSelectedCompany: (company: Company | null) => void
  setShowDetail: (show: boolean) => void
  enrichCompany: (companyId: string) => void
  setHeatmapCells: (cells: HeatmapCell[]) => void
  setMapBounds: (bounds: MapBounds, zoom: number) => void
  setFlyToTarget: (target: FlyToTarget | null) => void
}

const initialFilters: SearchFilters = {
  query: '',
  segmentos: [],
  cnaes: [],
  uf: '',
  municipio: '',
  area: null,
}

export const useSearchStore = create<SearchState>((set) => ({
  filters: initialFilters,
  filteredCompanies: [],
  heatmapCells: [],
  selectedCompany: null,
  showDetail: false,
  mapBounds: null,
  mapZoom: 4,
  flyToTarget: null,
  setQuery: (query) => set((s) => ({ filters: { ...s.filters, query } })),
  setSegmentos: (segmentos) => set((s) => ({ filters: { ...s.filters, segmentos } })),
  setCnaes: (cnaes) => set((s) => ({ filters: { ...s.filters, cnaes } })),
  setUf: (uf) => set((s) => ({ filters: { ...s.filters, uf } })),
  setMunicipio: (municipio) => set((s) => ({ filters: { ...s.filters, municipio } })),
  setArea: (area) => set((s) => ({ filters: { ...s.filters, area } })),
  clearFilters: () => set({ filters: initialFilters }),
  setFilteredCompanies: (companies) => set({ filteredCompanies: companies }),
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  setShowDetail: (show) => set({ showDetail: show }),
  enrichCompany: (companyId) =>
    set((s) => ({
      filteredCompanies: s.filteredCompanies.map((c) =>
        c.id === companyId ? { ...c, is_enriched: true } : c
      ),
      selectedCompany:
        s.selectedCompany?.id === companyId
          ? { ...s.selectedCompany, is_enriched: true }
          : s.selectedCompany,
    })),
  setHeatmapCells: (cells) => set({ heatmapCells: cells }),
  setMapBounds: (bounds, zoom) => set({ mapBounds: bounds, mapZoom: zoom }),
  setFlyToTarget: (target) => set({ flyToTarget: target }),
}))
