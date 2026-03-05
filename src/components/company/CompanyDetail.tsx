import { useState } from 'react'
import {
  FiX, FiMapPin, FiPhone, FiMail, FiUsers, FiDollarSign,
  FiFileText, FiCheckCircle, FiExternalLink, FiCopy, FiNavigation,
} from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'
import { useSearchStore } from '../../store/search.store'
import { useRouteStore } from '../../store/route.store'
import RouteOriginPicker from './RouteOriginPicker'

export default function CompanyDetail() {
  const { selectedCompany, showDetail, setShowDetail, setSelectedCompany } = useSearchStore()
  const { route, isLoading, error, fetchRoute, clearRoute } = useRouteStore()
  const [showRoutePicker, setShowRoutePicker] = useState(false)

  if (!showDetail || !selectedCompany) return null

  const close = () => {
    setShowDetail(false)
    setSelectedCompany(null)
    setShowRoutePicker(false)
  }

  const handleTraceRoute = async (origin: [number, number], tracking: boolean) => {
    setShowRoutePicker(false)
    setShowDetail(false)
    setSelectedCompany(null)
    await fetchRoute(origin, [selectedCompany.latitude, selectedCompany.longitude], tracking)
  }

  const company = selectedCompany

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-[2000]" onClick={close} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-surface z-[2001] shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-surface-alt">
          <div>
            <h2 className="text-lg font-bold text-text">{company.nome_fantasia}</h2>
            <p className="text-xs text-text-muted">{company.razao_social}</p>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-text-muted"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <FiCheckCircle size={16} />
              Enriquecido
            </span>
          </div>

          {/* Dados gerais */}
          <section>
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <FiFileText size={16} className="text-secondary" />
              Dados Gerais
            </h3>
            <div className="space-y-2">
              <InfoRow label="CNPJ" value={company.cnpj} copyable />
              <InfoRow label="Segmento" value={company.segmento} />
              <InfoRow label="CNAE" value={`${company.cnae_codigo} - ${company.cnae_descricao}`} />
              <InfoRow label="Funcionários" value={company.faixa_funcionarios} />
              <InfoRow label="Faturamento" value={company.faixa_faturamento} />
            </div>
          </section>

          {/* Localização */}
          <section>
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <FiMapPin size={16} className="text-secondary" />
              Localização
            </h3>
            <div className="space-y-2">
              <InfoRow label="Endereço" value={company.endereco} />
              <InfoRow label="Cidade" value={`${company.municipio}/${company.uf}`} />
              <InfoRow label="CEP" value={company.cep} />
            </div>
          </section>

          {/* Contatos */}
          <section>
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <FiPhone size={16} className="text-secondary" />
              Telefones
            </h3>
            <div className="space-y-2">
              {company.telefones.map((tel, i) => (
                <div key={i} className="flex items-center justify-between bg-surface-alt rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    {tel.whatsapp ? (
                      <FaWhatsapp className="text-green-500" size={16} />
                    ) : (
                      <FiPhone className="text-text-muted" size={14} />
                    )}
                    <span className="text-sm text-text">{tel.numero}</span>
                    <span className="text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded">
                      {tel.tipo}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(tel.numero)}
                    className="p-1 hover:bg-surface-alt rounded transition-colors"
                    title="Copiar"
                  >
                    <FiCopy size={14} className="text-text-muted" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <FiMail size={16} className="text-secondary" />
              E-mails
            </h3>
            <div className="space-y-2">
              {company.emails.map((email, i) => (
                <div key={i} className="flex items-center justify-between bg-surface-alt rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <FiMail className="text-blue-500" size={14} />
                    <span className="text-sm text-text">{email.email}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      email.validacao === 'ENTREGAVEL'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {email.validacao === 'ENTREGAVEL' ? 'Válido' : 'Não verificado'}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(email.email)}
                    className="p-1 hover:bg-surface-alt rounded transition-colors"
                    title="Copiar"
                  >
                    <FiCopy size={14} className="text-text-muted" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Ações rápidas */}
          <section>
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <FiExternalLink size={16} className="text-secondary" />
              Ações
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-surface-alt transition-colors text-text">
                <FiUsers size={16} />
                Ver contatos
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-surface-alt transition-colors text-text">
                <FiDollarSign size={16} />
                Adicionar à lista
              </button>
            </div>

            {!showRoutePicker && !route && (
              <button
                onClick={() => setShowRoutePicker(true)}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors mt-2 disabled:opacity-50"
              >
                <FiNavigation size={16} />
                {isLoading ? 'Calculando rota...' : 'Traçar rota'}
              </button>
            )}

            {showRoutePicker && (
              <RouteOriginPicker
                onSelectOrigin={handleTraceRoute}
                onCancel={() => setShowRoutePicker(false)}
                isLoading={isLoading}
              />
            )}

            {error && (
              <p className="text-xs text-red-500 mt-2">{error}</p>
            )}

            {route && (
              <div className="bg-surface-alt rounded-lg p-3 mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text">Rota traçada</span>
                  <button
                    onClick={() => { clearRoute(); setShowRoutePicker(false) }}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Limpar rota
                  </button>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs text-text-muted">Distância</p>
                    <p className="text-sm font-semibold text-text">{formatDistance(route.distance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Tempo estimado</p>
                    <p className="text-sm font-semibold text-text">{formatDuration(route.duration)}</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`
  return `${Math.round(meters)} m`
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.ceil((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes} min`
}

function InfoRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-text-muted whitespace-nowrap">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-xs text-text text-right">{value}</span>
        {copyable && (
          <button
            onClick={() => navigator.clipboard.writeText(value)}
            className="p-0.5 hover:bg-surface-alt rounded"
          >
            <FiCopy size={11} className="text-text-muted" />
          </button>
        )}
      </div>
    </div>
  )
}
