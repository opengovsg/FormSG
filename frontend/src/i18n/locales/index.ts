import { ResourceLanguage } from 'i18next'

import { Language } from '~shared/types'

import { enSG } from './en-sg'
import { msSG } from './ms-sg'
import { taSG } from './ta-sg'
import { zhSG } from './zh-sg'

export const locales = {
  [Language.ENGLISH]: enSG as unknown as ResourceLanguage,
  [Language.CHINESE]: zhSG as unknown as ResourceLanguage,
  [Language.MALAY]: msSG as unknown as ResourceLanguage,
  [Language.TAMIL]: taSG as unknown as ResourceLanguage,
}
