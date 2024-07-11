import { enSG as navbar } from './features/admin-form/navbar'
import { enSG as fields } from './features/admin-form/sidebar/fields'
import { enSG as headerAndInstructions } from './features/admin-form/sidebar/header-and-instructions'
import { enSG as logic } from './features/admin-form/sidebar/logic'
import { enSG as thankYou } from './features/admin-form/sidebar/thank-you'
import { enSG as common } from './features/common'
import { enSG as login } from './features/login'
import { enSG as publicForm } from './features/public-form'
import { FallbackTranslation } from './types'

export const enSG: FallbackTranslation = {
  translation: {
    features: {
      navbar,
      common,
      login,
      publicForm,
      fields,
      headerAndInstructions,
      logic,
      thankYou,
    },
  },
}
