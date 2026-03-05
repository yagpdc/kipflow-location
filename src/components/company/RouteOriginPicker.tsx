import { useState } from 'react'
import { FiNavigation, FiEdit3, FiSearch, FiX, FiLoader } from 'react-icons/fi'

const USER_LOCATION_KEY = 'geo-kipflow-user-location'

interface RouteOriginPickerProps {
  onSelectOrigin: (latlng: [number, number], tracking: boolean) => void
  onCancel: () => void
  isLoading: boolean
}

export default function RouteOriginPicker({ onSelectOrigin, onCancel, isLoading }: RouteOriginPickerProps) {
  const [mode, setMode] = useState<'pick' | 'address'>('pick')
  const [address, setAddress] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMyLocation = () => {
    try {
      const raw = localStorage.getItem(USER_LOCATION_KEY)
      if (raw) {
        const { lat, lng } = JSON.parse(raw)
        if (typeof lat === 'number' && typeof lng === 'number') {
          onSelectOrigin([lat, lng], true)
          return
        }
      }
    } catch { /* ignore */ }

    if (!navigator.geolocation) {
      setError('Geolocalização não disponível')
      return
    }

    setGeocoding(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelectOrigin([pos.coords.latitude, pos.coords.longitude], true)
        setGeocoding(false)
      },
      () => {
        setError('Não foi possível obter sua localização')
        setGeocoding(false)
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  const handleAddressSearch = async () => {
    if (!address.trim()) return
    setGeocoding(true)
    setError(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'GeoKipFlow/1.0' } }
      )
      const data = await res.json()
      if (!data.length) {
        setError('Endereço não encontrado')
        return
      }
      onSelectOrigin([parseFloat(data[0].lat), parseFloat(data[0].lon)], false)
    } catch {
      setError('Erro ao buscar endereço')
    } finally {
      setGeocoding(false)
    }
  }

  const busy = geocoding || isLoading

  if (mode === 'address') {
    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
            placeholder="Digite o endereço de origem..."
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 bg-input text-text"
            disabled={busy}
            autoFocus
          />
          <button
            onClick={handleAddressSearch}
            disabled={busy || !address.trim()}
            className="p-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {busy ? <FiLoader size={16} className="animate-spin" /> : <FiSearch size={16} />}
          </button>
          <button
            onClick={() => { setMode('pick'); setError(null) }}
            className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-text-muted"
          >
            <FiX size={16} />
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      <p className="text-xs text-text-muted">Escolha o ponto de partida:</p>
      <div className="flex gap-2">
        <button
          onClick={handleMyLocation}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-surface-alt transition-colors text-text disabled:opacity-50"
        >
          {busy ? <FiLoader size={16} className="animate-spin" /> : <FiNavigation size={16} />}
          Minha localização
        </button>
        <button
          onClick={() => { setMode('address'); setError(null) }}
          disabled={busy}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-surface-alt transition-colors text-text disabled:opacity-50"
        >
          <FiEdit3 size={16} />
          Digitar endereço
        </button>
      </div>
      <button
        onClick={onCancel}
        className="w-full text-xs text-text-muted hover:text-text transition-colors py-1"
      >
        Cancelar
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
