import { PartialDeep } from 'type-fest'

import { msSG as publicForm } from './features/public-form'
import Translation from './types'

export const msSG: PartialDeep<Translation> = {
  translation: {
    features: {
      publicForm,
    },
  },
}
