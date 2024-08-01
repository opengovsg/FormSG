import { Language } from '~shared/types'

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
    // This case should not occur
    default:
      throw new Error('Invalid unicode locale')
  }
}
