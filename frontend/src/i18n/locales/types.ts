import { RequiredDeep } from 'type-fest'

import {
  Common,
  Fields,
  HeaderAndInstructions,
  LandingPage,
  Logic,
  Login,
  Meta,
  Modals,
  Navbar,
  PublicForm,
  Settings,
  ThankYou,
  Toasts,
  Workflow,
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
          workflow?: Workflow
        }
        navbar?: Navbar
        meta?: Meta
        modals?: Modals
        toasts?: Toasts
        settings?: Settings
      }
      common?: Common
      landingPage?: LandingPage
      publicForm?: PublicForm
      login?: Login
    }
  }
}

export interface FallbackTranslation extends Translation {
  translation: {
    features: RequiredDeep<Translation['translation']['features']>
  }
}

export default Translation
