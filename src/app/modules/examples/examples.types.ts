import {
  IAgency,
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

export type QueryData = {
  [k in RetrievalType]: {
    generalQueryModel: IFormStatisticsTotalModel | ISubmissionModel
    lookUpMiddleware: Record<string, unknown>[]
    groupByMiddleware: Record<string, unknown>[]
    singleSearchPipeline: (formId: string) => Record<string, unknown>[]
  }
}

export type QueryExecResult = {
  _id: string
  count: number
  lastSubmission: Date | null
  title: IForm['title']
  form_fields: IForm['form_fields']
  logo: IAgency['logo']
  agency: IAgency['shortName']
  colorTheme: StartPage['colorTheme']
  avgFeedback: number | null
}

export type RetrieveSubmissionsExecResult =
  | [
      {
        _id: string
        count: number
        lastSubmission: Date
        formFeedbackInfo: IFormFeedbackSchema[]
        avgFeddback: number | null
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

export type ExamplesQueryParams =
  | {
      pageNo: string
      agency?: string
      searchTerm?: string
      shouldGetTotalNumResults?: string
    }
  | Record<string, never>

export type FormInfo = QueryExecResult & {
  timeText: string
}

export type SingleFormInfoQueryResult = [FormInfo] | undefined | []
