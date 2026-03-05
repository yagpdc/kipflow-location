import { useEffect, useRef, useState } from 'react'
import { FiSearch, FiFilter, FiX } from 'react-icons/fi'
import { useSearchStore } from '../../store/search.store'
import { SEGMENTS } from '../../mocks/segments'
import { CNAES } from '../../mocks/cnaes'
import { MOCK_COMPANIES } from '../../mocks/companies'
import { UF_COORDS } from '../../constants/uf-coords'
import CustomSelect from '../ui/CustomSelect'

const UF_OPTIONS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

const UF_SELECT_OPTIONS = [
  { value: '', label: 'Todos os estados' },
  ...UF_OPTIONS.map((uf) => ({ value: uf, label: uf })),
]

export default function MobileFilters() {
  const {
    filters,
    setQuery,
    setSegmentos,
    setCnaes,
    setUf,
    setMunicipio,
    clearFilters,
    filteredCompanies,
    setFlyToTarget,
  } = useSearchStore()
  const [showFilters, setShowFilters] = useState(false)
  const [cnaeSearch, setCnaeSearch] = useState('')
  const municipioDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleUfChange = (uf: string) => {
    setUf(uf)
    if (uf && UF_COORDS[uf]) {
      setFlyToTarget(UF_COORDS[uf])
    }
  }

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

      const lat = matching.reduce((s, c) => s + c.latitude, 0) / matching.length
      const lng = matching.reduce((s, c) => s + c.longitude, 0) / matching.length
      const uniqueCities = new Set(matching.map((c) => `${c.municipio}-${c.uf}`))
      const zoom = uniqueCities.size === 1 ? 12 : 10
      setFlyToTarget({ center: [lat, lng], zoom })
    }, 600)
  }

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

  const activeFilterCount =
    filters.segmentos.length + filters.cnaes.length + (filters.uf ? 1 : 0) + (filters.area ? 1 : 0)

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
    <>
      <div className="flex items-center gap-2 p-3 bg-surface border-b border-border">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={filters.query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface-alt"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="relative p-2.5 rounded-lg border border-border hover:bg-surface-alt transition-colors"
        >
          <FiFilter size={18} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="text-xs text-text-muted whitespace-nowrap">
          {filteredCompanies.length}
        </div>
      </div>

      {showFilters && (
        <div className="absolute top-[52px] left-0 right-0 z-[1000] bg-surface border-b border-border shadow-lg max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <span className="text-sm font-medium text-text">Filtros</span>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-red-500 font-medium">
                  Limpar
                </button>
              )}
              <button onClick={() => setShowFilters(false)}>
                <FiX size={18} className="text-text-muted" />
              </button>
            </div>
          </div>

          {/* Segmento */}
          <div className="p-3">
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
                      : 'bg-surface text-text-muted border-border hover:border-primary'
                  }`}
                >
                  {seg}
                </button>
              ))}
            </div>
          </div>

          {/* CNAE */}
          <div className="p-3 pt-0">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">
              CNAE
            </label>
            <input
              type="text"
              placeholder="Buscar CNAE..."
              value={cnaeSearch}
              onChange={(e) => setCnaeSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-input text-text"
            />
            <div className="max-h-28 overflow-y-auto custom-scrollbar space-y-1">
              {filteredCnaes.map((cnae) => (
                <label key={cnae.codigo} className="flex items-start gap-2 cursor-pointer text-xs p-1.5">
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
          <div className="p-3 pt-0">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 block">
              Localização
            </label>
            <div className="space-y-2">
              <CustomSelect
                value={filters.uf}
                onChange={handleUfChange}
                options={UF_SELECT_OPTIONS}
                placeholder="Todos os estados"
              />
              <input
                type="text"
                placeholder="Cidade..."
                value={filters.municipio}
                onChange={(e) => handleMunicipioChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-input text-text"
              />
            </div>
          </div>

          <div className="p-3 pt-0">
            <button
              onClick={() => setShowFilters(false)}
              className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}
    </>
  )
}
