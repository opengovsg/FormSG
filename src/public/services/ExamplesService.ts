import axios from 'axios'

import {
  ExampleFormsQueryDto,
  ExampleFormsResult,
  ExampleSingleFormResult,
} from '../../types/api'

export const EXAMPLES_ENDPOINT = '/examples'

/**
 * Gets example forms that matches the specified parameters for listing
 * @param exampleFormsSearchParams The search terms to query the backend for
 * @returns The list of retrieved examples if `shouldGetTotalNumResults` is false
 * @returns The list of retrieved examples with the total results if `shouldGetTotalNumResults` is true
 */
export const getExampleForms = (
  exampleFormsSearchParams: ExampleFormsQueryDto,
): Promise<ExampleFormsResult> => {
  return axios
    .get<ExampleFormsResult>(EXAMPLES_ENDPOINT, {
      params: exampleFormsSearchParams,
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
