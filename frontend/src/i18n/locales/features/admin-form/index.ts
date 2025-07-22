export * from './en-sg'
export { type Feedback } from './feedback'
export { type Meta } from './meta'
export { type Modals } from './modals'
export { type Navbar } from './navbar'
export { type ResponsesCharts } from './responses/charts'
export { type ResponsesComponents } from './responses/components'
export { type ResponsesIndividualResponse } from './responses/individual-response'
export { type ResponsesResponsesPage } from './responses/responses-page'
export { type Settings } from './settings'
export {
  type Fields,
  type HeaderAndInstructions,
  type Logic,
  type ThankYou,
  type Workflow,
} from './sidebar'
export { type Toasts } from './toasts'

export interface AdminForbiddenErrorPage {
  title: string
  message: string
  button: {
    text: {
      back: string
      goToDashboard: string
      login: string
    }
  }
}

