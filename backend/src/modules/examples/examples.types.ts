import {
  IAgency,
  IField,
  IForm,
  IFormFeedbackSchema,
  IFormStatisticsTotalModel,
  ISubmissionModel,
  StartPage,
} from 'src/types'

export enum RetrievalType {
  Stats = 'statistics',
  Submissions = 'submissions',
}

export type QueryDataMap = {
  generalQueryModel: IFormStatisticsTotalModel | ISubmissionModel
  lookUpMiddleware: Record<string, unknown>[]
  groupByMiddleware: Record<string, unknown>[]
  singleSearchPipeline: (formId: string) => Record<string, unknown>[]
}

export type QueryData = {
  [k in RetrievalType]: QueryDataMap
}

export type QueryExecResult = {
  _id: string
  count: number
  lastSubmission: Date | null
  title: IForm['title']
  form_fields: IField[]
  logo: IAgency['logo']
  agency: IAgency['shortName']
  colorTheme: NonNullable<StartPage['colorTheme']>
  avgFeedback: number | null
}

export type RetrieveSubmissionsExecResult =
  | [
      {
        _id: string
        count: number
        lastSubmission: Date
        formFeedbackInfo: IFormFeedbackSchema[]
        avgFeedback: number | null
      },
    ]
  | undefined
  | []

export type QueryExecResultWithTotal = {
  pageResults: QueryExecResult[]
  totalCount: {
    count: number
  }[]
}[]

export type FormattedQueryExecResult = QueryExecResult & {
  timeText: string
}

export type QueryPageResult = {
  forms: FormattedQueryExecResult[]
}

export type QueryPageResultWithTotal = {
  forms: FormattedQueryExecResult[]
  totalNumResults: number
}

export type ExamplesQueryParams = {
  pageNo: number
  agency?: string
  searchTerm?: string
  shouldGetTotalNumResults?: boolean
}

export type FormInfo = QueryExecResult & {
  timeText: string
}

export type SingleFormResult = {
  form: FormInfo
}

export type SingleFormInfoQueryResult = [FormInfo] | undefined | []
