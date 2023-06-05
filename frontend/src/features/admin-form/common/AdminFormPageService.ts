import {
  EndPageUpdateDto,
  PaymentsUpdateDto,
  StartPageUpdateDto,
} from '~shared/types'

import { ApiService } from '~services/ApiService'

const ADMIN_FORM_ENDPOINT = '/admin/forms'

/**
 * Updates the start page for the given form referenced by its id
 *
 * @param formId the id of the form to update start page for
 * @param newEndPage the new start page to replace with
 * @returns the updated start page on success
 */
export const updateFormStartPage = async (
  formId: string,
  newStartPage: StartPageUpdateDto,
): Promise<StartPageUpdateDto> => {
  return ApiService.put<StartPageUpdateDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/start-page`,
    newStartPage,
  ).then(({ data }) => data)
}

/**
 * Updates the end page for the given form referenced by its id
 *
 * @param formId the id of the form to update end page for
 * @param newEndPage the new end page to replace with
 * @returns the updated end page on success
 */
export const updateFormEndPage = async (
  formId: string,
  newEndPage: EndPageUpdateDto,
): Promise<EndPageUpdateDto> => {
  return ApiService.put<EndPageUpdateDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/end-page`,
    newEndPage,
  ).then(({ data }) => data)
}

/**
 * Updates the payments for the given form referenced by its id
 *
 * @param formId the id of the form to update payments for
 * @param newPayments the new payment to replace with
 * @returns the updated payment on success
 */
export const updateFormPayments = async (
  formId: string,
  newPayments: PaymentsUpdateDto,
): Promise<PaymentsUpdateDto> => {
  return ApiService.put<PaymentsUpdateDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/payments`,
    newPayments,
  ).then(({ data }) => data)
}
