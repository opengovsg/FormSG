import { PartialDeep } from 'type-fest'

import { zhSG as publicForm } from './features/public-form'
import Translation from './types'

export const zhSG: PartialDeep<Translation> = {
  translation: {
    features: {
      publicForm,
    },
  },
}
