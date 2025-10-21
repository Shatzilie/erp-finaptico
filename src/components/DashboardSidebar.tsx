import { NavLink } from 'react-router-dom';
import { useTenantFeatures } from '@/hooks/useTenantFeatures';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { MENU_DEF } from '@/lib/menu';
import { Building2, ScrollText } from 'lucide-react';

export const DashboardSidebar = () => {
  const { slug, features } = useTenantFeatures();
  const { isSuperAdmin } = useSuperAdmin();

  // Mientras carga, muestra un placeholder simple
  if (!features || !slug) {
    return (
      <div className="bg-gradient-sidebar w-64 min-h-screen p-6">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Portal Financiero</h2>
          <p className="text-gray-300 text-sm">Gestión empresarial</p>
        </div>
        <div className="text-sm text-gray-300">Cargando menú…</div>
      </div>
    );
  }

  const visible: Array<keyof typeof MENU_DEF> = [];
  if (features.show_dashboard) visible.push("dashboard");
  if (features.show_treasury)  visible.push("treasury");
  if (features.show_invoicing) visible.push("invoicing");
  if (features.show_expenses)  visible.push("expenses");
  if (features.show_vat)       visible.push("vat");
  if (features.show_irpf)      visible.push("irpf");
  if (features.show_is)        visible.push("is");
  if (features.show_calendar)  visible.push("calendar");
  if (features.show_docs)      visible.push("docs");
  if (features.show_advisory)  visible.push("advisory");
  if (features.show_company)   visible.push("company");
  
  // Nóminas, Modelo 111 y Mi cuenta siempre visibles
  visible.push("payroll");
  visible.push("modelo111");
  visible.push("account");

  return (
    <div className="bg-gradient-sidebar w-64 min-h-screen p-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-2">Portal Financiero</h2>
        <p className="text-gray-300 text-sm">Gestión empresarial</p>
      </div>

      <nav className="space-y-2">
        {visible.map((k) => {
          const item = MENU_DEF[k];
          const to = item.path(slug);
          return (
            <NavLink
              key={k}
              to={to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? "bg-white/20 text-white shadow-sm" : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          );
        })}

        {/* Admin Section - Only visible for super-admins */}
        {isSuperAdmin && (
          <>
            <div className="pt-4 pb-2">
              <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Administración
              </div>
            </div>
            
            <NavLink
              to="/admin/clients"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? "bg-white/20 text-white shadow-sm" : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Building2 className="h-4 w-4" />
              Clientes
            </NavLink>

            <NavLink
              to="/admin/logs"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? "bg-white/20 text-white shadow-sm" : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <ScrollText className="h-4 w-4" />
              Logs de Auditoría
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
};