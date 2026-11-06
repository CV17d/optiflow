import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import esTranslation from './locales/es.json'
import enTranslation from './locales/en.json'
import ptTranslation from './locales/pt.json'

export const LANG_STORAGE_KEY = 'optiflow-lang'

const getInitialLanguage = (): string => {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY)
    if (saved && ['es', 'en', 'pt'].includes(saved)) {
      return saved
    }
  } catch {
    // fallback
  }
  return 'es'
}

const resources = {
  es: { translation: esTranslation },
  en: { translation: enTranslation },
  pt: { translation: ptTranslation }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false // React already protects against XSS
    }
  })

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lng)
  } catch {
    // ignore
  }
})

export default i18n
