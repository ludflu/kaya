/**
 * i18n Configuration for Kaya
 *
 * Uses react-i18next for internationalization.
 * Supported locales: en, zh, ko, ja, fr, de, es, it
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import en from './locales/en.json';

export const locales = {
  en: 'English',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
} as const;

export type Locale = keyof typeof locales;

export const defaultLocale: Locale = 'en';

// Storage key for persisting locale preference
const LOCALE_STORAGE_KEY = 'kaya-locale';

/**
 * Detect the user's preferred locale
 */
export function detectLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && stored in locales) {
      return stored as Locale;
    }

    const browserLang = navigator.language.split('-')[0];
    if (browserLang in locales) {
      return browserLang as Locale;
    }
  }

  return defaultLocale;
}

// Type for nested translation resources - i18next expects ResourceKey which allows nested objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationResource = Record<string, any>;

// Lazy load translations for non-English locales
const localeLoaders: Record<Locale, () => Promise<{ default: TranslationResource }>> = {
  en: () => Promise.resolve({ default: en }),
  zh: () => import('./locales/zh.json'),
  ko: () => import('./locales/ko.json'),
  ja: () => import('./locales/ja.json'),
  fr: () => import('./locales/fr.json'),
  de: () => import('./locales/de.json'),
  es: () => import('./locales/es.json'),
  it: () => import('./locales/it.json'),
};

/**
 * Load messages for a locale
 */
export async function loadLocale(locale: Locale): Promise<void> {
  if (!i18n.hasResourceBundle(locale, 'translation')) {
    try {
      const { default: messages } = await localeLoaders[locale]();
      i18n.addResourceBundle(locale, 'translation', messages);
    } catch (error) {
      console.warn(`Failed to load locale "${locale}", using fallback`);
    }
  }

  await i18n.changeLanguage(locale);

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
}

/**
 * Get the current active locale
 */
export function getLocale(): Locale {
  return (i18n.language as Locale) || defaultLocale;
}

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: detectLocale(),
  fallbackLng: defaultLocale,
  interpolation: {
    escapeValue: false, // React already escapes
  },
  react: {
    useSuspense: false, // Disable suspense to avoid issues with lazy loading
    bindI18n: 'languageChanged loaded', // Re-render on language change
    bindI18nStore: 'added removed', // Re-render when resources change
  },
});

export { i18n };
