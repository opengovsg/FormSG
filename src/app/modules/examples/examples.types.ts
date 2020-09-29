import {
  IAgency,
  IForm,
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
  }
}

export type QueryExecResult = {
  _id: string
  count: number
  lastSubmission: Date
  title: IForm['title']
  form_fields: IForm['form_fields']
  logo: IAgency['logo']
  agency: IAgency['shortName']
  colorTheme: StartPage['colorTheme']
  avgFeedback: number
}

export type QueryExecResultWithTotal = {
  pageResults: QueryExecResult[]
  totalCount: {
    count: number
  }[]
}[]

export type FormattedQueryExecResult = QueryExecResult & {
  timeText: string
}

export type QueryPageResultWithTotal = {
  forms: FormattedQueryExecResult[]
  totalNumResults: number
}

export type QueryParams =
  | {
      pageNo: string
      agency: string
      searchTerm?: string
      shouldGetTotalNumResults?: string
    }
  | Record<string, never>
