import { enSG as adminFormNavbar } from './features/admin-form-navbar'
import { enSG as common } from './features/common'
import { enSG as login } from './features/login'
import { enSG as publicForm } from './features/public-form'
import { FallbackTranslation } from './types'

export const enSG: FallbackTranslation = {
  translation: {
    features: {
      adminFormNavbar,
      common,
      login,
      publicForm,
    },
  },
}
