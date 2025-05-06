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
import { enSG as fieldValidation } from './utils/field-validation'
import { enSG as formValidation } from './utils/form-validation'
<<<<<<< HEAD
import { enSG as workspaceValidation } from './utils/workspace-validation'
=======
>>>>>>> 44b5baa0f (chore: lint)
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
      workspaceValidation,
      fieldValidation,
    },
    components: {
      pagination,
    },
    constants: {
      validationConstants,
    },
  },
}
