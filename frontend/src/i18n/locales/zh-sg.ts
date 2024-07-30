import { PartialDeep } from 'type-fest'

import { zhSG as login } from './features/login'
import Translation from './types'

export const zhSG: PartialDeep<Translation> = {
  translation: {
    features: {
      login,
    },
  },
}
