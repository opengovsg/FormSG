import { PartialDeep } from 'type-fest'

import { taSG as publicForm } from './features/public-form'
import Translation from './types'

export const taSG: PartialDeep<Translation> = {
  translation: {
    features: {
      publicForm,
    },
  },
}
