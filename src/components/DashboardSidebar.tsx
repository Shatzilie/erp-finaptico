import { BarChart3, TrendingUp, Receipt, CreditCard } from 'lucide-react';
import { NavLink, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    title: 'Dashboard',
    href: 'dashboard',
    icon: BarChart3,
  },
  {
    title: 'Tesorería',
    href: 'treasury',
    icon: CreditCard,
  },
  {
    title: 'Ingresos vs Gastos',
    href: 'income-expenses',
    icon: TrendingUp,
  },
  {
    title: 'Estado IVA',
    href: 'vat-status',
    icon: Receipt,
  },
];

export const DashboardSidebar = () => {
  const { tenant } = useParams<{ tenant: string }>();

  return (
    <div className="bg-gradient-sidebar w-64 min-h-screen p-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-2">Portal Financiero</h2>
        <p className="text-gray-300 text-sm">Gestión empresarial</p>
      </div>

      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const href = `/${tenant}/${item.href}`;
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.href}
              to={href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};