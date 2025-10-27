/**
 * Utilidades de formateo para números y monedas
 */

/**
 * Formatea un número como moneda en euros
 * @param value - Valor numérico a formatear
 * @param decimals - Número de decimales (por defecto 2)
 * @returns String formateado como moneda
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Formatea un número con separadores de miles
 * @param value - Valor numérico a formatear
 * @param decimals - Número de decimales (por defecto 0)
 * @returns String formateado con separadores
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Formatea un porcentaje
 * @param value - Valor del porcentaje (0-100)
 * @param decimals - Número de decimales (por defecto 1)
 * @returns String formateado como porcentaje
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}

/**
 * Calcula el cambio porcentual entre dos valores
 * @param current - Valor actual
 * @param previous - Valor anterior
 * @returns Porcentaje de cambio (puede ser positivo o negativo)
 */
export function calculateDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Formatea un delta como string con signo
 * @param delta - Valor del delta
 * @param decimals - Número de decimales (por defecto 1)
 * @returns String formateado con signo (ej: "+12.5%" o "-3.2%")
 */
export function formatDelta(delta: number | null, decimals: number = 1): string {
  if (delta === null) return 'N/A';
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(decimals)}%`;
}
