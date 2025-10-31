import * as React from 'react'
import { en } from './en'
import { am } from './am'

type Language = 'en' | 'am'
type Translations = typeof en

interface TranslationContextType {
  language: Language
  t: Translations
  setLanguage: (lang: Language) => void
}

const TranslationContext = React.createContext<TranslationContextType | null>(null)

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>(() => {
    const stored = localStorage.getItem('phm.language') as Language | null
    return stored || 'en'
  })

  const translations: Record<Language, Translations> = {
    en,
    am
  }

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('phm.language', lang)
  }

  const value = {
    language,
    t: translations[language],
    setLanguage
  }

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = React.useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  return context
}
