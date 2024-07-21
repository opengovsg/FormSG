import { Navbar, Common, Login, PublicForm, Fields, HeaderAndInstructions, Logic, ThankYou} from './features'

interface Translation {
  translation: {
    features: {
      adminForm: {
        sidebar: {
          fields?: Fields
          headerAndInstructions?: HeaderAndInstructions
          logic?: Logic
          thankYou?: ThankYou
        }
        navbar?: Navbar
      }
      common?: Common
      publicForm?: PublicForm
      login?: Login
    }
  }
}

export interface FallbackTranslation extends Translation {
  translation: {
    features: {
      adminForm: {
        sidebar: {
          fields: Fields
          headerAndInstructions: HeaderAndInstructions
          logic: Logic
          thankYou: ThankYou
        }
        navbar: Navbar
      }
      common: Common
      publicForm: PublicForm
      login: Login
    }
  }
}

export default Translation
