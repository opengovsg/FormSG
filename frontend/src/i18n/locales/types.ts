import { RequiredDeep } from 'type-fest'

import {
  App,
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
  Workspace,
} from './features'
import { FormValidation } from './utils'

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
      app?: App
      common?: Common
      landingPage?: LandingPage
      publicForm?: PublicForm
      login?: Login
      workspace?: Workspace
    }
    utils: {
      formValidation?: FormValidation
    }
  }
}

export interface FallbackTranslation extends Translation {
  translation: {
    features: RequiredDeep<Translation['translation']['features']>
    utils: RequiredDeep<Translation['translation']['utils']>
  }
}

export default Translation
