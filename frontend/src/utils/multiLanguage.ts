import {
  Language,
  TranslationMapping,
  TranslationOptionMapping,
} from '~shared/types'

export const convertUnicodeLocaleToLanguage = (language: Language) => {
  switch (language) {
    case Language.ENGLISH:
      return 'English'
    case Language.CHINESE:
      return 'Chinese'
    case Language.MALAY:
      return 'Malay'
    case Language.TAMIL:
      return 'Tamil'
    default:
      throw new Error('Invalid unicode locale')
  }
}

export const getDefaultSupportedLanguages = () => Object.values(Language)

interface SelectedLanguageProps {
  defaultValue: string
  translations?: TranslationMapping[]
  selectedLanguage: Language
}

interface SelectedLanguageFieldOptionProps {
  defaultValue: string[]
  translations?: TranslationOptionMapping[]
  selectedLanguage: Language
}

export const getValueInSelectedLanguage = ({
  defaultValue,
  translations,
  selectedLanguage,
}: SelectedLanguageProps) => {
  let title = defaultValue

  const titleTranslations = translations ?? []
  // check if there are any title translations for the selected language
  const titleTranslationIdx = titleTranslations.findIndex(
    (titleTranslation) => {
      return titleTranslation.language === selectedLanguage
    },
  )

  // If there are title translations for the selected language, use the translation.
  // If not default it to English.
  if (titleTranslationIdx !== -1) {
    title = titleTranslations[titleTranslationIdx].translation
  }

  return title
}

export const getFieldOptionsInSelectedLanguage = ({
  defaultValue,
  translations = [],
  selectedLanguage,
}: SelectedLanguageFieldOptionProps) => {
  const fieldOptionsTranslations = translations

  const translationIdx = fieldOptionsTranslations.findIndex((translation) => {
    return translation.language === selectedLanguage
  })

  // Check if translations for field options exist and whether
  // each field option has its own respective translation. If not
  // render the default field options in English.
  if (
    translationIdx !== -1 &&
    fieldOptionsTranslations[translationIdx].translation.length ===
      defaultValue.length
  ) {
    return fieldOptionsTranslations[translationIdx].translation
  } else {
    return defaultValue
  }
}
