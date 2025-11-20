import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';

// Mock hooks
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/hooks/useTenantAccess', () => ({
  useTenantAccess: vi.fn()
}));

import { useAuth } from '@/contexts/AuthContext';
import { useTenantAccess } from '@/hooks/useTenantAccess';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show loading while auth is loading', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: false,
      isLoading: true
    });

    (useTenantAccess as any).mockReturnValue({
      tenantSlug: undefined,
      hasAccess: false,
      isLoading: false,
      error: null
    });

    const { getByText } = renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(getByText('Cargando sesión...')).toBeDefined();
  });

  it('should show loading while tenant is loading', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      isLoading: false
    });

    (useTenantAccess as any).mockReturnValue({
      tenantSlug: undefined,
      hasAccess: false,
      isLoading: true,
      error: null
    });

    const { getByText } = renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(getByText('Verificando permisos...')).toBeDefined();
  });

  it('should show error when user has no tenant access', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      isLoading: false
    });

    (useTenantAccess as any).mockReturnValue({
      tenantSlug: null,
      hasAccess: false,
      isLoading: false,
      error: 'Sin acceso'
    });

    const { getByText } = renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(getByText('Acceso Denegado')).toBeDefined();
  });

  it('should render children when authenticated with access', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      isLoading: false
    });

    (useTenantAccess as any).mockReturnValue({
      tenantSlug: 'test-tenant',
      hasAccess: true,
      isLoading: false,
      error: null
    });

    const { getByText } = renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(getByText('Protected Content')).toBeDefined();
  });

  it('should handle multi-tenant scenario', () => {
    (useAuth as any).mockReturnValue({
      isAuthenticated: true,
      isLoading: false
    });

    // Simula usuario con múltiples tenants (ya seleccionó el primero)
    (useTenantAccess as any).mockReturnValue({
      tenantSlug: 'blacktar',
      hasAccess: true,
      isLoading: false,
      error: null
    });

    const { getByText } = renderWithRouter(
      <ProtectedRoute>
        <div>Multi-tenant Content</div>
      </ProtectedRoute>
    );

    expect(getByText('Multi-tenant Content')).toBeDefined();
  });
});
