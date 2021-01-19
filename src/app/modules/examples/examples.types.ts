import { IAgency, IForm, StartPage } from 'src/types'

export type QueryExecResult = {
  _id: string
  title: IForm['title']
  form_fields: IForm['form_fields']
  logo: IAgency['logo']
  agency: IAgency['shortName']
  colorTheme: StartPage['colorTheme']
  avgFeedback: number | null
}

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
