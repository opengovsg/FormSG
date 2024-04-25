import { zhSG as common } from './features/common'
import { zhSG as login } from './features/login'
import { zhSG as publicForm } from './features/public-form'
import Translation from './types'

export const zhSG: Translation = {
  translation: {
    features: {
      common,
      login,
      publicForm,
    },
  },
}
