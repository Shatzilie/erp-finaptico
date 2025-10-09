export type MenuKey =
  | "dashboard"
  | "invoicing"
  | "expenses"
  | "vat"
  | "irpf"
  | "is"
  | "treasury"
  | "calendar"
  | "docs"
  | "advisory"
  | "company"
  | "monitoring";

export const MENU_DEF: Record<
  MenuKey,
  { label: string; path: (slug: string) => string; icon?: string; requiresAdmin?: boolean }
> = {
  dashboard: { label: "Dashboard", path: (s) => `/${s}/dashboard`, icon: "dashboard" },
  invoicing: { label: "Facturación", path: (s) => `/${s}/invoicing`, icon: "bar" },
  expenses:  { label: "Gastos",      path: (s) => `/${s}/expenses`, icon: "coins" },
  vat:       { label: "IVA",         path: (s) => `/${s}/vat`, icon: "receipt" },
  irpf:      { label: "IRPF",        path: (s) => `/${s}/irpf`, icon: "percent" },
  is:        { label: "Impuesto Sociedades", path: (s) => `/${s}/is`, icon: "bank" },
  treasury:  { label: "Tesorería",   path: (s) => `/${s}/treasury`, icon: "wallet" },
  calendar:  { label: "Calendario fiscal", path: (s) => `/${s}/calendar`, icon: "calendar" },
  docs:      { label: "Documentación", path: (s) => `/${s}/docs`, icon: "paper" },
  advisory:  { label: "Asesoría",    path: (s) => `/${s}/advisory`, icon: "chat" },
  company:   { label: "Mi empresa",  path: (s) => `/${s}/company`, icon: "building" },
  monitoring: { label: "Monitoring", path: () => `/monitoring`, icon: "activity", requiresAdmin: true }
};