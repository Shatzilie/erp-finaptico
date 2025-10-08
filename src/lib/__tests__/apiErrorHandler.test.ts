import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleApiError } from '../apiErrorHandler';

const mockToastError = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: mockToastError,
  },
}));

describe('apiErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle NO_SESSION error', () => {
    const error = { message: 'NO_SESSION' };
    handleApiError(error, 'TestModule');

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('Tu sesión ha expirado')
    );
  });

  it('should handle UNAUTHORIZED error', () => {
    const error = { message: 'HTTP_401:Unauthorized' };
    handleApiError(error, 'TestModule');

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('Tu sesión ha expirado')
    );
  });

  it('should handle FORBIDDEN error', () => {
    const error = { message: 'HTTP_403:Forbidden' };
    handleApiError(error, 'TestModule');

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('No tienes permiso')
    );
  });

  it('should handle rate limit error with retry time', () => {
    const error = { message: 'RATE_LIMIT:60' };
    handleApiError(error, 'TestModule');

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('Demasiadas peticiones')
    );
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('1 minuto')
    );
  });

  it('should handle client rate limit error', () => {
    const error = { message: 'CLIENT_RATE_LIMIT:Demasiadas peticiones' };
    handleApiError(error, 'TestModule');

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('Demasiadas peticiones')
    );
  });

  it('should handle timeout error', () => {
    const error = { name: 'AbortError', message: 'The operation was aborted' };
    handleApiError(error, 'TestModule');

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('La petición tardó demasiado')
    );
  });

  it('should handle network error', () => {
    const error = { message: 'Failed to fetch' };
    handleApiError(error, 'TestModule');

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('Error de conexión')
    );
  });

  it('should handle 500 server error', () => {
    const error = { message: 'HTTP_500:Internal Server Error' };
    handleApiError(error, 'TestModule');

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('Error del servidor')
    );
  });

  it('should handle generic error without exposing details', () => {
    const error = { message: 'Some technical database error with stack trace' };
    handleApiError(error, 'TestModule');

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('Error del servidor')
    );
    // No debería contener detalles técnicos
    expect(mockToastError).not.toHaveBeenCalledWith(
      expect.stringContaining('database')
    );
    expect(mockToastError).not.toHaveBeenCalledWith(
      expect.stringContaining('stack trace')
    );
  });

  it('should log sanitized error to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error message');

    handleApiError(error, 'TestModule');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[TestModule]')
    );

    consoleSpy.mockRestore();
  });

  it('should handle error object with status code', () => {
    const error = { message: 'HTTP_404:Not Found' };
    handleApiError(error, 'TestModule');

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('Error del servidor')
    );
  });
});
