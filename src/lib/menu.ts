export type MenuKey =
  | "dashboard"
  | "invoicing"
  | "expenses"
  | "vat"
  | "irpf"
  | "is"
  | "treasury"
  | "payroll"
  | "modelo111"
  | "calendar"
  | "docs"
  | "advisory"
  | "company"
  | "account"
  | "admin_logs";

export const MENU_DEF: Record<
  MenuKey,
  { label: string; path: (slug: string) => string; icon?: string }
> = {
  dashboard: { label: "Dashboard", path: (s) => `/${s}/dashboard`, icon: "dashboard" },
  invoicing: { label: "Facturación", path: (s) => `/${s}/invoicing`, icon: "bar" },
  expenses:  { label: "Gastos",      path: (s) => `/${s}/expenses`, icon: "coins" },
  vat:       { label: "IVA",         path: (s) => `/${s}/vat`, icon: "receipt" },
  irpf:      { label: "IRPF",        path: (s) => `/${s}/irpf`, icon: "percent" },
  is:        { label: "Impuesto Sociedades", path: (s) => `/${s}/is`, icon: "bank" },
  treasury:  { label: "Tesorería",   path: (s) => `/${s}/treasury`, icon: "wallet" },
  payroll:   { label: "Nóminas",     path: (s) => `/${s}/payroll`, icon: "users" },
  modelo111: { label: "Modelo 111",  path: (s) => `/${s}/modelo-111`, icon: "file-text" },
  calendar:  { label: "Calendario fiscal", path: (s) => `/${s}/calendar`, icon: "calendar" },
  docs:      { label: "Documentación", path: (s) => `/${s}/docs`, icon: "paper" },
  advisory:  { label: "Asesoría",    path: (s) => `/${s}/advisory`, icon: "chat" },
  company:   { label: "Mi empresa",  path: (s) => `/${s}/company`, icon: "building" },
  account:   { label: "Mi cuenta",   path: (s) => `/${s}/account`, icon: "user" },
  admin_logs: { label: "Logs de auditoría", path: () => `/admin/logs`, icon: "file-text" }
};