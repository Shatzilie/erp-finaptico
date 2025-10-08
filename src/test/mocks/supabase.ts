import { vi } from 'vitest';

export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

export const mockAuthContext = {
  isAuthenticated: true,
  user: { id: 'test-user-id', email: 'test@example.com' },
  loading: false,
  signOut: vi.fn(),
};
