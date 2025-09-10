export interface Tenant {
  slug: string;
  name: string;
  fullName: string;
}

export const TENANTS: Record<string, Tenant> = {
  'young-minds': {
    slug: 'young-minds',
    name: 'Young Minds',
    fullName: 'Young Minds Big Ideas, S.L.',
  },
  'blacktar': {
    slug: 'blacktar',
    name: 'Blacktar',
    fullName: 'Blacktar, S.L.',
  },
};

export const getTenant = (slug: string): Tenant | null => {
  return TENANTS[slug] || null;
};

export const isValidTenant = (slug: string): boolean => {
  return slug in TENANTS;
};