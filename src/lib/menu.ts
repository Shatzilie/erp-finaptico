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
  | "account"
  | "monitoring";

export const MENU_DEF: Record<
  MenuKey,
  { label: string; path: string; icon?: string; requiresAdmin?: boolean }
> = {
  dashboard: { label: "Dashboard", path: "/dashboard", icon: "dashboard" },
  invoicing: { label: "Facturación", path: "/invoicing", icon: "bar" },
  expenses:  { label: "Gastos",      path: "/expenses", icon: "coins" },
  vat:       { label: "IVA",         path: "/vat", icon: "receipt" },
  irpf:      { label: "IRPF",        path: "/irpf", icon: "percent" },
  is:        { label: "Impuesto Sociedades", path: "/is", icon: "bank" },
  treasury:  { label: "Tesorería",   path: "/treasury", icon: "wallet" },
  calendar:  { label: "Calendario fiscal", path: "/calendar", icon: "calendar" },
  docs:      { label: "Documentación", path: "/docs", icon: "paper" },
  advisory:  { label: "Asesoría",    path: "/advisory", icon: "chat" },
  company:   { label: "Mi empresa",  path: "/company", icon: "building" },
  account:   { label: "Mi cuenta",   path: "/account", icon: "user" },
  monitoring: { label: "Monitoring", path: "/monitoring", icon: "activity", requiresAdmin: true }
};