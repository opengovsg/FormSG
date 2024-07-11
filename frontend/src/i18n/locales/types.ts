import { AdminFormNavbar, Common, Login, PublicForm } from './features'

interface Translation {
  translation: {
    features: {
      adminFormNavbar?: AdminFormNavbar
      common?: Common
      publicForm?: PublicForm
      login?: Login
    }
  }
}

export interface FallbackTranslation extends Translation {
  translation: {
    features: Required<Translation['translation']['features']>
  }
}

export default Translation
