import { useSearchStore } from '../../store/search.store'
import CompanyCard from '../company/CompanyCard'

export default function CompanyList() {
  const { filteredCompanies } = useSearchStore()

  if (filteredCompanies.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div>
          <p className="text-text-muted text-sm">Nenhuma empresa encontrada</p>
          <p className="text-text-muted text-xs mt-1">Tente ajustar os filtros ou desenhar uma área no mapa</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {filteredCompanies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  )
}
