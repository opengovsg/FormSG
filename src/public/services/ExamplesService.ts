import axios from 'axios'

import { DuplicateFormBody } from 'src/app/modules/form/admin-form/admin-form.types'
import { FormMetaView, PublicForm } from 'src/types'

import {
  ExampleFormsQueryDto,
  ExampleFormsResult,
  ExampleSingleFormResult,
} from '../../types/api'

export const EXAMPLES_ENDPOINT = '/examples'
export const ADMIN_FORM_ENDPOINT = '/api/v3/admin/forms'

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

/**
 * Used to create a new form from an existing template.
 * @param formId formId of template to base the new form on
 * @returns Metadata for newly created form in dashboard view
 */
export const useTemplate = async (
  formId: string,
  overrideParams: DuplicateFormBody,
): Promise<FormMetaView> => {
  return axios
    .post<FormMetaView>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/adminform/copy`,
      overrideParams,
    )
    .then(({ data }) => data)
}

/**
 * Queries templates with use-template or examples listings. Any logged in officer is authorized.
 * @param formId formId of template in question
 * @returns Public view of a template
 */
export const queryTemplate = async (
  formId: string,
): Promise<{ form: PublicForm }> => {
  return axios
    .get<{ form: PublicForm }>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/adminform/template`,
    )
    .then(({ data }) => data)
}
