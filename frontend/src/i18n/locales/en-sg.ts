import { enSG as adminForm } from './features/admin-form'
import { enSG as common } from './features/common'
import { enSG as landingPage } from './features/landing-page'
import { enSG as login } from './features/login'
import { enSG as publicForm } from './features/public-form'
import { FallbackTranslation } from './types'

export const enSG: FallbackTranslation = {
  translation: {
    features: {
      adminForm,
      common,
      landingPage,
      login,
      publicForm,
    },
  },
}
