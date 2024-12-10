import simplur from 'simplur'

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

export const MAXIMUM_FILE_LABEL_TRANSLATIONS: Record<Language, string> = {
  [Language.ENGLISH]: 'Maximum file size:',
  [Language.CHINESE]: '文件限制：不超过',
  [Language.MALAY]: 'Saiz fail maksimum:',
  [Language.TAMIL]: 'கோப்பின் அதிகபட்ச அளவு:',
}

export const ADD_ANOTHER_ROW_LABEL_TRANSLATIONS: Record<Language, string> = {
  [Language.ENGLISH]: 'Add another row',
  [Language.CHINESE]: '添加另一行',
  [Language.MALAY]: 'Tambah satu lagi baris',
  [Language.TAMIL]: 'மற்றொரு வரிசையைச் சேர்க்கவும்',
}

export function getTranslationsForTableFieldRows({
  maxRows,
  currentRows,
  selectedLanguage,
}: {
  maxRows: number | ''
  currentRows: number
  selectedLanguage: Language
}) {
  switch (selectedLanguage) {
    case Language.CHINESE:
      return maxRows
        ? `${currentRows} 行，最多 ${maxRows} 行`
        : `${currentRows} 行`
    case Language.MALAY:
      return maxRows
        ? `${currentRows} daripada maksimum ${maxRows} baris`
        : `${currentRows} baris`
    case Language.TAMIL:
      return maxRows
        ? `அதிகபட்சம் ${currentRows} வரிசைகளுக்கு ${maxRows}`
        : `வரிசைகளுக்கு ${currentRows}`
    default:
      return maxRows
        ? simplur`${currentRows} out of max ${maxRows} row[|s]`
        : simplur`${currentRows} row[|s]`
  }
}
