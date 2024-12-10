import { Language } from '~shared/types'

export const OTHERS_TRANSLATED_LABEL: Record<Language, string> = {
  [Language.ENGLISH]: 'Others',
  [Language.CHINESE]: '其他',
  [Language.MALAY]: 'Lain-lain',
  [Language.TAMIL]: 'மற்றவை',
}

export const DEFAULT_PLACEHOLDER_TRANSLATIONS: Record<Language, string> = {
  [Language.ENGLISH]: 'Select an option',
  [Language.CHINESE]: '请选择一个选项',
  [Language.MALAY]: 'Pilih satu pilihan',
  [Language.TAMIL]: 'ஒரு விருப்பத்தை தேர்வு செய்யவும்',
}

export const NOTHING_FOUND_LABEL_TRANSLATIONS: Record<Language, string> = {
  [Language.ENGLISH]: 'No matching results',
  [Language.CHINESE]: '没有匹配结果',
  [Language.MALAY]: 'Tiada hasil yang sepadan',
  [Language.TAMIL]: 'முடிவுகள் எதுவும் பொருந்தவில்லை',
}
