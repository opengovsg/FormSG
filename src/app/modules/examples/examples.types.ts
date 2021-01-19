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

export type QueryPageResult = {
  forms: QueryExecResult[]
}

export type QueryPageResultWithTotal = {
  forms: QueryExecResult[]
  totalNumResults: number
}

export type ExamplesQueryParams = {
  pageNo: number
  agency?: string
  searchTerm?: string
  shouldGetTotalNumResults?: boolean
}

export type FormInfo = QueryExecResult

export type SingleFormResult = {
  form: FormInfo
}

export type SingleFormInfoQueryResult = [FormInfo] | undefined | []
