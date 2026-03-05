import { useEffect, useRef, useState } from 'react'
import { FiSearch, FiX, FiChevronDown, FiChevronUp, FiFilter } from 'react-icons/fi'
import { useSearchStore } from '../../store/search.store'
import { SEGMENTS } from '../../mocks/segments'
import { CNAES } from '../../mocks/cnaes'
import { MOCK_COMPANIES } from '../../mocks/companies'
import { UF_COORDS } from '../../constants/uf-coords'

const UF_OPTIONS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

export default function SearchPanel() {
  const {
    filters,
    setQuery,
    setSegmentos,
    setCnaes,
    setUf,
    setMunicipio,
    clearFilters,
    setFlyToTarget,
  } = useSearchStore()

  const [showFilters, setShowFilters] = useState(true)
  const [cnaeSearch, setCnaeSearch] = useState('')
  const municipioDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fly to UF center when state filter changes
  const handleUfChange = (uf: string) => {
    setUf(uf)
    if (uf && UF_COORDS[uf]) {
      setFlyToTarget(UF_COORDS[uf])
    }
  }

  // Fly to municipality centroid with debounce
  const handleMunicipioChange = (value: string) => {
    setMunicipio(value)
    if (municipioDebounceRef.current) clearTimeout(municipioDebounceRef.current)
    if (!value || value.length < 3) return

    municipioDebounceRef.current = setTimeout(() => {
      const m = value.toLowerCase()
      const matching = MOCK_COMPANIES.filter((c) =>
        c.municipio.toLowerCase().includes(m)
      )
      if (matching.length === 0) return

      // Compute centroid of all matching companies
      const lat = matching.reduce((s, c) => s + c.latitude, 0) / matching.length
      const lng = matching.reduce((s, c) => s + c.longitude, 0) / matching.length

      // Check if all belong to same city for tighter zoom
      const uniqueCities = new Set(matching.map((c) => `${c.municipio}-${c.uf}`))
      const zoom = uniqueCities.size === 1 ? 12 : 10

      setFlyToTarget({ center: [lat, lng], zoom })
    }, 600)
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (municipioDebounceRef.current) clearTimeout(municipioDebounceRef.current)
    }
  }, [])

  const filteredCnaes = cnaeSearch
    ? CNAES.filter(
        (c) =>
          c.codigo.includes(cnaeSearch) ||
          c.descricao.toLowerCase().includes(cnaeSearch.toLowerCase())
      )
    : CNAES

  const hasActiveFilters =
    filters.query ||
    filters.segmentos.length > 0 ||
    filters.cnaes.length > 0 ||
    filters.uf ||
    filters.municipio ||
    filters.area

  const toggleSegmento = (seg: string) => {
    if (filters.segmentos.includes(seg)) {
      setSegmentos(filters.segmentos.filter((s) => s !== seg))
    } else {
      setSegmentos([...filters.segmentos, seg])
    }
  }

  const toggleCnae = (codigo: string) => {
    if (filters.cnaes.includes(codigo)) {
      setCnaes(filters.cnaes.filter((c) => c !== codigo))
    } else {
      setCnaes([...filters.cnaes, codigo])
    }
  }

  return (
    <div className="h-full flex flex-col bg-surface border-r border-border overflow-hidden">
      {/* Search header */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Buscar empresa, CNPJ, CNAE..."
            value={filters.query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-surface-alt"
          />
          {filters.query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Filters toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center justify-between px-4 py-3 text-sm font-medium text-text hover:bg-surface-alt transition-colors border-b border-border"
      >
        <div className="flex items-center gap-2">
          <FiFilter size={16} />
          Filtros
          {hasActiveFilters && (
            <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">
              {filters.segmentos.length + filters.cnaes.length + (filters.uf ? 1 : 0) + (filters.area ? 1 : 0)}
            </span>
          )}
        </div>
        {showFilters ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>

      {/* Filters */}
      {showFilters && (
        <div className="overflow-y-auto custom-scrollbar flex-shrink-0">
          {/* Clear all */}
          {hasActiveFilters && (
            <div className="px-4 pt-3">
              <button
                onClick={clearFilters}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}

          {/* Segmento */}
          <div className="p-4 pb-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">
              Segmento
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SEGMENTS.map((seg) => (
                <button
                  key={seg}
                  onClick={() => toggleSegmento(seg)}
                  className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                    filters.segmentos.includes(seg)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface text-text-muted border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  {seg}
                </button>
              ))}
            </div>
          </div>

          {/* CNAE */}
          <div className="p-4 pb-2">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">
              CNAE
            </label>
            <input
              type="text"
              placeholder="Buscar CNAE..."
              value={cnaeSearch}
              onChange={(e) => setCnaeSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-input text-text"
            />
            <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
              {filteredCnaes.map((cnae) => (
                <label
                  key={cnae.codigo}
                  className="flex items-start gap-2 cursor-pointer text-xs hover:bg-surface-alt p-1.5 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filters.cnaes.includes(cnae.codigo)}
                    onChange={() => toggleCnae(cnae.codigo)}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="text-text leading-tight">
                    <span className="font-medium">{cnae.codigo}</span> - {cnae.descricao}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Localização */}
          <div className="p-4 pb-4">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">
              Localização
            </label>
            <div className="space-y-2">
              <select
                value={filters.uf}
                onChange={(e) => handleUfChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-input text-text"
              >
                <option value="">Todos os estados</option>
                {UF_OPTIONS.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Cidade..."
                value={filters.municipio}
                onChange={(e) => handleMunicipioChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-input text-text"
              />
            </div>
            {filters.area && (
              <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                <FiSearch size={12} />
                Área desenhada no mapa ativa
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
