import { Navbar, Common, Login, PublicForm, Fields, HeaderAndInstructions, Logic, ThankYou} from './features'

interface Translation {
  translation: {
    features: {
      navbar?: Navbar
      common?: Common
      publicForm?: PublicForm
      login?: Login
      fields?: Fields
      headerAndInstructions?: HeaderAndInstructions
      logic?: Logic
      thankYou?: ThankYou
    }
  }
}

export interface FallbackTranslation extends Translation {
  translation: {
    features: Required<Translation['translation']['features']>
  }
}

export default Translation
