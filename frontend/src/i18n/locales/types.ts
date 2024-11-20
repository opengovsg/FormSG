import { DeepRequired } from 'ts-essentials'

import {
  Common,
  Fields,
  HeaderAndInstructions,
  Logic,
  Login,
  Meta,
  Modals,
  Navbar,
  PublicForm,
  ThankYou,
  Toasts,
} from './features'

interface Translation {
  translation: {
    features: {
      adminForm?: {
        sidebar?: {
          fields?: Fields
          headerAndInstructions?: HeaderAndInstructions
          logic?: Logic
          thankYou?: ThankYou
        }
        navbar?: Navbar
        meta?: Meta
        modals?: Modals
        toasts?: Toasts
      }
      common?: Common
      publicForm?: PublicForm
      login?: Login
    }
  }
}

export interface FallbackTranslation extends Translation {
  translation: {
    features: DeepRequired<Translation['translation']['features']>
  }
}

export default Translation
