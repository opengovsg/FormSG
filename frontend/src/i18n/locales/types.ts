import { RequiredDeep } from 'type-fest'

import { Pagination } from './components'
import { ValidationConstants } from './constants'
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
  ResponsesCharts,
  ResponsesComponents,
  ResponsesIndividualResponse,
  ResponsesResponsesPage,
  Settings,
  ThankYou,
  Toasts,
  TransferOwnership,
  WhatsNew,
  Workflow,
  Workspace,
} from './features'
import { FormValidation, WorkspaceValidation } from './utils'

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
        responses?: {
          charts?: ResponsesCharts
          components?: ResponsesComponents
          individualResponse?: ResponsesIndividualResponse
          responsesPage?: ResponsesResponsesPage
        }
      }
      app?: App
      common?: Common
      landingPage?: LandingPage
      publicForm?: PublicForm
      login?: Login
      workspace?: Workspace
      whatsNew?: WhatsNew
      user?: {
        transferOwnership: TransferOwnership
      }
    }
    utils: {
      formValidation?: FormValidation
      workspaceValidation?: WorkspaceValidation
    }
    components: {
      pagination?: Pagination
    }
    constants: {
      validationConstants?: ValidationConstants
    }
  }
}

export interface FallbackTranslation extends Translation {
  translation: {
    features: RequiredDeep<Translation['translation']['features']>
    utils: RequiredDeep<Translation['translation']['utils']>
    components: RequiredDeep<Translation['translation']['components']>
    constants: RequiredDeep<Translation['translation']['constants']>
  }
}

export default Translation
