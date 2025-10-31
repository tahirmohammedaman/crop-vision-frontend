import * as React from 'react'
import { useTranslation } from '@/translations/translation-provider'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation()

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'am' : 'en'
    setLanguage(newLang)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      aria-label="Toggle language"
      className="gap-2"
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs font-medium">
        {language === 'en' ? 'አማርኛ' : 'English'}
      </span>
    </Button>
  )
}
