import { Language } from '~shared/types'

type VerifyTranslations = {
  Verify: string
  Verified: string
}

export const VERIFY_LABEL_TRANSLATIONS: Record<Language, VerifyTranslations> = {
  [Language.ENGLISH]: { Verify: 'Verify', Verified: 'Verified' },
  [Language.CHINESE]: { Verify: '验证', Verified: '已验证' },
  [Language.MALAY]: { Verify: 'Sahkan', Verified: 'Disahkan' },
  [Language.TAMIL]: {
    Verify: 'சரிபார்க்கவும்',
    Verified: 'சரிபார்க்கப்பட்டது',
  },
}
