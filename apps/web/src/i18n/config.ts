
export const locales = ['fr', 'ar'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export function isValidLocale(
  value: string,
): value is Locale {
  return locales.some((locale) => locale === value);
}

export function getDirection(
  locale: Locale,
): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
