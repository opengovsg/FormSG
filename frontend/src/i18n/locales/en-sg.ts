import { enSG as pagination } from './components/pagination'
import { enSG as validationConstants } from './constants/validation'
import { enSG as adminForm } from './features/admin-form'
import { enSG as app } from './features/app'
import { enSG as common } from './features/common'
import { enSG as landingPage } from './features/landing-page'
import { enSG as login } from './features/login'
import { enSG as publicForm } from './features/public-form'
import { enSG as user } from './features/user'
import { enSG as whatsNew } from './features/whats-new'
import { enSG as workspace } from './features/workspace'
import { enSG as formValidation } from './utils/form-validation'
import { FallbackTranslation } from './types'

export const enSG: FallbackTranslation = {
  translation: {
    features: {
      adminForm,
      app,
      common,
      landingPage,
      login,
      publicForm,
      workspace,
      whatsNew,
      user,
    },
    utils: {
      formValidation,
    },
    components: {
      pagination,
    },
    constants: {
      validationConstants,
    },
  },
}
