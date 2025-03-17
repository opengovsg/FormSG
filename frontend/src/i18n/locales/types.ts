import { RequiredDeep } from 'type-fest'

import {
  App,
  Common,
  Fields,
  HeaderAndInstructions,
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
      publicForm?: PublicForm
      login?: Login
      workspace?: Workspace
    }
  }
}

export interface FallbackTranslation extends Translation {
  translation: {
    features: RequiredDeep<Translation['translation']['features']>
  }
}

export default Translation
