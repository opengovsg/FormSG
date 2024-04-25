import { enSG as common } from './features/common'
import { enSG as login } from './features/login'
import { enSG as publicForm } from './features/public-form'
import Translation from './types'

export const enSG: Translation = {
  translation: {
    features: {
      common,
      login,
      publicForm,
    },
  },
}
