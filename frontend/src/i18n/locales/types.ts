import { DeepRequired } from 'ts-essentials'

import {
  Common,
  Fields,
  HeaderAndInstructions,
  Logic,
  Login,
  Meta,
  Navbar,
  PublicForm,
  ThankYou,
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
