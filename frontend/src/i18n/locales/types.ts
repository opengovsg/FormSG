import { RequiredDeep } from 'type-fest'

import { Pagination } from './components'
import {
  App,
  Common,
  Feedback,
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
        feedback?: Feedback
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
    components: {
      pagination?: Pagination
    }
  }
}

export interface FallbackTranslation extends Translation {
  translation: {
    features: RequiredDeep<Translation['translation']['features']>
    utils: RequiredDeep<Translation['translation']['utils']>
    components: RequiredDeep<Translation['translation']['components']>
  }
}

export default Translation
