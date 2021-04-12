import {
  QueryPageResult,
  QueryPageResultWithTotal,
  SingleFormResult,
} from '../../app/modules/examples/examples.types'

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

export type ExampleFormsResult = QueryPageResult | QueryPageResultWithTotal
// NOTE: Renaming for clarity that this type refers to an example
export type ExampleSingleFormResult = SingleFormResult
