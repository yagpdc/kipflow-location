import { FiMapPin, FiUsers, FiPhone, FiMail, FiCheckCircle } from 'react-icons/fi'
import { useSearchStore } from '../../store/search.store'
import { useCreditsStore } from '../../store/credits.store'
import type { Company } from '../../types'

const SEGMENT_COLORS: Record<string, string> = {
  'Tecnologia': '#3b82f6',
  'Saúde': '#ef4444',
  'Varejo': '#f59e0b',
  'Educação': '#8b5cf6',
  'Alimentação': '#f97316',
  'Indústria': '#6b7280',
  'Construção Civil': '#92400e',
  'Serviços Financeiros': '#059669',
  'Logística': '#0891b2',
  'Consultoria': '#7c3aed',
  'Marketing': '#ec4899',
  'Agronegócio': '#16a34a',
}

interface CompanyCardProps {
  company: Company
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const { setSelectedCompany, setShowDetail, enrichCompany } = useSearchStore()
  const { credits, spendCredits } = useCreditsStore()

  const handleClick = () => {
    if (!company.is_enriched) {
      if (credits < 1) return
      spendCredits(1)
      enrichCompany(company.id)
      const enriched = { ...company, is_enriched: true }
      setSelectedCompany(enriched)
    } else {
      setSelectedCompany(company)
    }
    setShowDetail(true)
  }

  return (
    <div
      onClick={handleClick}
      className="p-4 border-b border-border hover:bg-surface-alt cursor-pointer transition-colors group"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-text group-hover:text-primary transition-colors leading-tight">
          {company.nome_fantasia}
        </h4>
        <span
          className="shrink-0 text-[10px] px-2 py-0.5 rounded-full text-white font-medium"
          style={{ backgroundColor: SEGMENT_COLORS[company.segmento] || '#6b7280' }}
        >
          {company.segmento}
        </span>
      </div>

      <p className="text-xs text-text-muted mb-2 leading-tight">{company.cnae_descricao}</p>

      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <FiMapPin size={11} />
          {company.municipio}/{company.uf}
        </span>
        <span className="flex items-center gap-1">
          <FiUsers size={11} />
          {company.faixa_funcionarios}
        </span>
      </div>

      {company.is_enriched ? (
        <div className="mt-2 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-600">
            <FiCheckCircle size={11} />
            Enriquecido
          </span>
          <span className="flex items-center gap-1 text-text-muted">
            <FiPhone size={11} />
            {company.telefones.length}
          </span>
          <span className="flex items-center gap-1 text-text-muted">
            <FiMail size={11} />
            {company.emails.length}
          </span>
        </div>
      ) : (
        <div className="mt-2">
          <span className="text-xs text-primary font-medium">
            {credits > 0 ? 'Clique para enriquecer' : 'Sem créditos'}
          </span>
        </div>
      )}
    </div>
  )
}
