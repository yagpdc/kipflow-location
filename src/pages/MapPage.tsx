import { FiLogOut, FiZap } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { useCreditsStore } from "../store/credits.store";
import { useThemeStore } from "../store/theme.store";
import ThemeSwitch from "../components/ThemeSwitch";
import { useCompanySearch } from "../hooks/useCompanySearch";
import MapView from "../components/map/MapView";
import SearchPanel from "../components/search/SearchPanel";
import MobileFilters from "../components/search/MobileFilters";
import CompanyDetail from "../components/company/CompanyDetail";

import LogoDark from "../assets/logos/kipflow preto.svg";
import LogoWhite from "../assets/logos/kipflow branco.svg";

export default function MapPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const credits = useCreditsStore((s) => s.credits);
  const { isDark } = useThemeStore();

  useCompanySearch();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-surface border-b border-border z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-text">
            <img
              src={isDark ? LogoWhite : LogoDark}
              alt="KipFlow Logo"
              className="h-auto w-37.5"
            />
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg">
            <FiZap size={14} />
            <span className="text-sm font-semibold">{credits}</span>
            <span className="text-xs hidden sm:inline">créditos</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-sm text-text-muted">
            <span>{user?.name}</span>
          </div>

          <ThemeSwitch />

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-text-muted hover:text-text"
            title="Sair"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </header>

      {/* Mobile search bar */}
      <div className="sm:hidden relative z-10">
        <MobileFilters />
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop sidebar */}
        <div className="hidden sm:flex w-80 shrink-0">
          <SearchPanel />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapView />
        </div>
      </div>

      {/* Company detail drawer */}
      <CompanyDetail />
    </div>
  );
}
