import { RequiredDeep } from 'type-fest'

import {
  FeatureBanner,
  Footer,
  FormEndPage,
  GovtMasthead,
  Pagination,
} from './components'
import { ValidationConstants } from './constants'
import {
  AdminForbiddenError,
  App,
  Common,
  Feedback,
  Fields,
  HeaderAndInstructions,
  LandingPage,
  LandingPayments,
  Logic,
  Login,
  Meta,
  Modals,
  Navbar,
  NotFoundError,
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
import { FieldValidation, FormValidation, WorkspaceValidation } from './utils'

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
      adminForbiddenError?: AdminForbiddenError
      app?: App
      common?: Common
      landingPage?: LandingPage
      landingPayments?: LandingPayments
      publicForm?: PublicForm
      login?: Login
      notFoundError?: NotFoundError
      workspace?: Workspace
      whatsNew?: WhatsNew
      user?: {
        transferOwnership: TransferOwnership
      }
    }
    utils: {
      fieldValidation?: FieldValidation
      formValidation?: FormValidation
      workspaceValidation?: WorkspaceValidation
    }
    components: {
      featureBanner?: FeatureBanner
      footer?: Footer
      formEndPage?: FormEndPage
      govtMasthead?: GovtMasthead
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
