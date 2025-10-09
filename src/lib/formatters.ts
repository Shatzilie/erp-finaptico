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
