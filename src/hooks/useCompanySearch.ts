import { useEffect } from 'react'
import { MOCK_COMPANIES } from '../mocks/companies'
import { useSearchStore } from '../store/search.store'
import type { Company, GeoArea, HeatmapCell, MapBounds } from '../types'

export const MAX_VIEWPORT_DIAGONAL_KM = 100 // ~50km de raio

function isInsideArea(company: Company, area: GeoArea): boolean {
  if (area.type === 'circle') {
    const [centerLat, centerLng] = area.center
    const distance = getDistanceKm(centerLat, centerLng, company.latitude, company.longitude)
    return distance <= area.radius / 1000
  }

  if (area.type === 'polygon') {
    return isPointInPolygon(company.latitude, company.longitude, area.coordinates)
  }

  return true
}

function isInsideBounds(company: Company, bounds: MapBounds): boolean {
  return (
    company.latitude >= bounds.south &&
    company.latitude <= bounds.north &&
    company.longitude >= bounds.west &&
    company.longitude <= bounds.east
  )
}

export function getBoundsDiagonalKm(bounds: MapBounds): number {
  return getDistanceKm(bounds.south, bounds.west, bounds.north, bounds.east)
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Convex hull (Graham scan)
function convexHull(points: [number, number][]): [number, number][] {
  if (points.length <= 2) return points
  const sorted = [...points].sort((a, b) => a[1] - b[1] || a[0] - b[0])

  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

  const lower: [number, number][] = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop()
    lower.push(p)
  }

  const upper: [number, number][] = []
  for (const p of sorted.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop()
    upper.push(p)
  }

  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

// Simple seeded random for deterministic jitter
function seededRand(seed: number): number {
  return ((Math.sin(seed * 9301 + 49297) * 233280) % 1 + 1) % 1
}

// Expand polygon outward from centroid and add jitter for organic look
function expandPolygon(
  points: [number, number][],
  centroid: [number, number],
  padding: number,
  seed: number
): [number, number][] {
  return points.map(([lat, lng], i) => {
    const dLat = lat - centroid[0]
    const dLng = lng - centroid[1]
    // Vary expansion per vertex for irregular shape
    const jitter = 0.7 + seededRand(seed + i * 17) * 0.6 // 0.7-1.3x variation
    const p = padding * jitter
    return [lat + dLat * p, lng + dLng * p] as [number, number]
  })
}

// Create an irregular blob for cities with very few points
function createBlob(center: [number, number], radius: number, seed: number): [number, number][] {
  const sides = 10
  const result: [number, number][] = []
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * 2 * Math.PI
    const r = radius * (0.7 + seededRand(seed + i * 13) * 0.6) // 0.7-1.3x
    result.push([
      center[0] + r * Math.cos(angle),
      center[1] + r * Math.sin(angle) * 1.2,
    ])
  }
  return result
}

function generateHeatmapClusters(companies: Company[]): HeatmapCell[] {
  if (companies.length === 0) return []

  // Group by municipio
  const groups = new Map<string, Company[]>()
  for (const c of companies) {
    const key = `${c.municipio}-${c.uf}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(c)
  }

  const cells: { coordinates: [number, number][]; centroid: [number, number]; count: number; municipio: string }[] = []

  for (const [key, group] of groups) {
    const count = group.length
    const centroid: [number, number] = [
      group.reduce((s, c) => s + c.latitude, 0) / count,
      group.reduce((s, c) => s + c.longitude, 0) / count,
    ]

    // Use key hash as seed for deterministic randomness per city
    const seed = key.split('').reduce((s, ch) => s + ch.charCodeAt(0), 0)

    let polygon: [number, number][]
    if (count < 3) {
      polygon = createBlob(centroid, 0.08, seed)
    } else {
      const points: [number, number][] = group.map((c) => [c.latitude, c.longitude])
      const hull = convexHull(points)
      polygon = expandPolygon(hull, centroid, 1.5, seed)
    }

    cells.push({ coordinates: polygon, centroid, count, municipio: group[0].municipio })
  }

  const maxCount = Math.max(...cells.map((c) => c.count))

  return cells.map((cell) => ({
    coordinates: cell.coordinates,
    centroid: cell.centroid,
    count: cell.count,
    intensity: cell.count / maxCount,
    municipio: cell.municipio,
  }))
}

function isPointInPolygon(lat: number, lng: number, polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i]
    const [yj, xj] = polygon[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

export function useCompanySearch() {
  const query = useSearchStore((s) => s.filters.query)
  const segmentos = useSearchStore((s) => s.filters.segmentos)
  const cnaes = useSearchStore((s) => s.filters.cnaes)
  const uf = useSearchStore((s) => s.filters.uf)
  const municipio = useSearchStore((s) => s.filters.municipio)
  const area = useSearchStore((s) => s.filters.area)
  const mapBounds = useSearchStore((s) => s.mapBounds)
  const setFilteredCompanies = useSearchStore((s) => s.setFilteredCompanies)
  const setHeatmapCells = useSearchStore((s) => s.setHeatmapCells)

  useEffect(() => {
    // Apply shared filters to all companies
    const applyFilters = (list: Company[]): Company[] => {
      let results = list

      if (query) {
        const q = query.toLowerCase()
        results = results.filter(
          (c) =>
            c.nome_fantasia.toLowerCase().includes(q) ||
            c.razao_social.toLowerCase().includes(q) ||
            c.cnpj.includes(q) ||
            c.cnae_descricao.toLowerCase().includes(q)
        )
      }

      if (segmentos.length > 0) {
        results = results.filter((c) => segmentos.includes(c.segmento))
      }

      if (cnaes.length > 0) {
        results = results.filter((c) => cnaes.includes(c.cnae_codigo))
      }

      if (uf) {
        results = results.filter((c) => c.uf === uf)
      }

      if (municipio) {
        const m = municipio.toLowerCase()
        results = results.filter((c) => c.municipio.toLowerCase().includes(m))
      }

      return results
    }

    if (area) {
      // Área desenhada pelo usuário tem prioridade — ignora filtros de localização (uf/município)
      const areaResults = MOCK_COMPANIES.filter((c) => isInsideArea(c, area))
      let results = areaResults

      if (query) {
        const q = query.toLowerCase()
        results = results.filter(
          (c) =>
            c.nome_fantasia.toLowerCase().includes(q) ||
            c.razao_social.toLowerCase().includes(q) ||
            c.cnpj.includes(q) ||
            c.cnae_descricao.toLowerCase().includes(q)
        )
      }
      if (segmentos.length > 0) {
        results = results.filter((c) => segmentos.includes(c.segmento))
      }
      if (cnaes.length > 0) {
        results = results.filter((c) => cnaes.includes(c.cnae_codigo))
      }
      // NÃO aplica filtros de uf/municipio quando área está ativa

      setFilteredCompanies(results)
      setHeatmapCells([])
      return
    }

    if (mapBounds && getBoundsDiagonalKm(mapBounds) <= MAX_VIEWPORT_DIAGONAL_KM) {
      // Zoom próximo — mostra markers
      const results = applyFilters(MOCK_COMPANIES.filter((c) => isInsideBounds(c, mapBounds)))
      setFilteredCompanies(results)
      setHeatmapCells([])
      return
    }

    // Mapa afastado — mostra heatmap se tem algum filtro ativo
    setFilteredCompanies([])

    const hasActiveFilter = segmentos.length > 0 || cnaes.length > 0 || !!uf || !!municipio
    if (hasActiveFilter) {
      const filtered = applyFilters(MOCK_COMPANIES)
      setHeatmapCells(generateHeatmapClusters(filtered))
    } else {
      setHeatmapCells([])
    }
  }, [query, segmentos, cnaes, uf, municipio, area, mapBounds, setFilteredCompanies, setHeatmapCells])
}
