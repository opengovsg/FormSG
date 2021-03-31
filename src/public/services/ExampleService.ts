import axios from 'axios'

import {
  QueryPageResult,
  QueryPageResultWithTotal,
  SingleFormResult,
} from '../../app/modules/examples/examples.types'

export const EXAMPLES_ENDPOINT = '/examples'

type ExampleFormsResult = QueryPageResult | QueryPageResultWithTotal
// NOTE: Renaming for clarity that this type refers to an example
type ExampleSingleFormResult = SingleFormResult

/**
 * Gets example forms that matches the specified parameters for listing
 * @param pageNo
 * @param searchTerm
 * @param agency
 * @param shouldGetTotalNumResults Whether to return all the results or not
 * @returns The list of retrieved examples if `shouldGetTotalNumResults` is false
 * @returns The list of retrieved examples with the total results if `shouldGetTotalNumResults` is true
 */
export const getExampleForms = (
  pageNo: number,
  searchTerm?: string,
  agency?: string,
  shouldGetTotalNumResults?: boolean,
): Promise<ExampleFormsResult> => {
  return axios
    .get<ExampleFormsResult>(EXAMPLES_ENDPOINT, {
      params: { pageNo, searchTerm, agency, shouldGetTotalNumResults },
      // disable IE ajax request caching (so search requests don't get cached)
      headers: { 'If-Modified-Since': '0' },
    })
    .then(({ data }) => data)
}
/**
 * Gets a single form for examples
 * @param formId The id of the form to search for
 * @returns The information of the example form
 */
export const getSingleExampleForm = (
  formId: string,
): Promise<ExampleSingleFormResult> => {
  return axios
    .get<ExampleSingleFormResult>(`${EXAMPLES_ENDPOINT}/${formId}`, {
      // disable IE ajax request caching (so search requests don't get cached)
      headers: { 'If-Modified-Since': '0' },
    })
    .then(({ data }) => data)
}
