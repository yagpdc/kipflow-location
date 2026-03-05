export interface Company {
  id: string
  cnpj: string
  nome_fantasia: string
  razao_social: string
  segmento: string
  cnae_codigo: string
  cnae_descricao: string
  latitude: number
  longitude: number
  endereco: string
  municipio: string
  uf: string
  cep: string
  telefones: Telefone[]
  emails: Email[]
  faixa_funcionarios: string
  faixa_faturamento: string
  is_enriched: boolean
}

export interface Telefone {
  numero: string
  tipo: 'FIXO' | 'MOVEL'
  whatsapp?: boolean
}

export interface Email {
  email: string
  validacao: 'ENTREGAVEL' | 'NAO_VERIFICADO'
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface SearchFilters {
  query: string
  segmentos: string[]
  cnaes: string[]
  uf: string
  municipio: string
  area: GeoArea | null
}

export type GeoArea =
  | { type: 'circle'; center: [number, number]; radius: number }
  | { type: 'polygon'; coordinates: [number, number][] }

export interface HeatmapCell {
  coordinates: [number, number][] // polygon vertices
  centroid: [number, number]
  count: number
  intensity: number // 0-1 normalizado
  municipio: string
}

export interface RouteInfo {
  geometry: [number, number][]
  distance: number
  duration: number
  origin: [number, number]
  destination: [number, number]
}

export interface User {
  id: string
  name: string
  email: string
}
