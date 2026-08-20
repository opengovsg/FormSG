import { RequiredDeep } from 'type-fest'

import { Pagination } from './components'
import { ValidationConstants } from './constants'
import {
  App,
  Collaborator,
  Common,
  EmergencyContact,
  FeatureTour,
  Feedback,
  Fields,
  HeaderAndInstructions,
  LandingPage,
  LandingPayments,
  LandingV5,
  Logic,
  Login,
  Meta,
  Modals,
  Navbar,
  NavLabels,
  NotFoundError,
  PublicForm,
  ResponsesCharts,
  ResponsesComponents,
  ResponsesIndividualResponse,
  ResponsesResponsesPage,
  Settings,
  Share,
  Template,
  ThankYou,
  Toasts,
  TransferOwnership,
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
          navLabels?: NavLabels
          thankYou?: ThankYou
          workflow?: Workflow
        }
        navbar?: Navbar
        meta?: Meta
        modals?: Modals
        toasts?: Toasts
        settings?: Settings
        feedback?: Feedback
        share?: Share
        featureTour?: FeatureTour
        collaborator?: Collaborator
        template?: Template
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
      landingPayments?: LandingPayments
      landingV5?: LandingV5
      notFoundError?: NotFoundError
      publicForm?: PublicForm
      login?: Login
      workspace?: Workspace
      user?: {
        emergencyContact: EmergencyContact
        transferOwnership: TransferOwnership
      }
    }
    utils: {
      fieldValidation?: FieldValidation
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
