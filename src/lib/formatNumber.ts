// Number formatting utilities for better UX

/**
 * Format number with thousand separators based on locale
 * 10000 -> 10.000 (ID) or 10,000 (EN)
 */
export function formatNumberWithSeparator(value: number | string, locale: string = 'id-ID'): string {
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
  if (isNaN(num)) return '';
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Parse formatted number string back to number
 * "10.000" -> 10000 or "10,000" -> 10000
 */
export function parseFormattedNumber(value: string): number {
  // Remove all non-numeric characters except decimal point and minus
  // Handle both comma and dot as thousand separators
  const cleaned = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=.*\.)/g, '') // Keep only last dot
    .replace(/,/g, ''); // Remove commas
  
  return parseFloat(cleaned) || 0;
}

/**
 * Format input value while typing - keeps cursor position correct
 */
export function formatInputValue(value: string, locale: string = 'id-ID'): string {
  // Remove non-numeric except decimal
  const cleaned = value.replace(/[^\d]/g, '');
  if (!cleaned) return '';
  
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return '';
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Get raw number from formatted input
 */
export function getRawNumber(formattedValue: string): string {
  return formattedValue.replace(/[^\d]/g, '');
}
