import { Colors, IField } from '../form'

// These types should sync with backend/src/modules/examples/examples.types.ts

// pageNo: The page to render
// searchTerm: The term to search on
// agency: The agency to search on - this can be all agencies or the user's agency
// shouldGetTotalNumResults: Whether to return all the results or not
export type ExampleFormsQueryDto = {
  pageNo: number
  searchTerm?: string
  agency?: string
  shouldGetTotalNumResults?: boolean
}

type ExampleResult = {
  _id: string
  count: number
  lastSubmission: Date | null
  title: string
  form_fields: IField[]
  logo: string
  agency: string
  colorTheme: Colors
  avgFeedback: number | null
  timeText: string
}

export type ExampleFormsResult = {
  forms: ExampleResult[]
  totalNumResults?: number
}

export type ExampleSingleFormResult = {
  form: ExampleResult
}
