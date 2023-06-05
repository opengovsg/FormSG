import { FormFeedbackDto, FormFeedbackMetaDto } from '~shared/types/form/'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '../../common/AdminViewFormService'

import { FeedbackCsvGenerator } from './utils/FeedbackCsvGenerator'

export const getFormFeedback = async (
  formId: string,
): Promise<FormFeedbackMetaDto> => {
  return ApiService.get<FormFeedbackMetaDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/feedback`,
  ).then(({ data }) => data)
}

/**
 * Counts feedback for a given form.
 * @param formId the id of the form to count feedback for
 * @returns the count of the retrieved feedback
 */
export const getFormFeedbackCount = async (formId: string): Promise<number> => {
  return ApiService.get<number>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/feedback/count`,
  ).then(({ data }) => data)
}

/**
 * Downloads feedback for a given form.
 * @param formId the id of the form to download feedback for
 * @param formTitle the title of the form
 * @returns a stream of feedback
 */
export const downloadFormFeedback = async (
  formId: string,
  formTitle: string,
): Promise<void> => {
  const expectedNumResponses = await getFormFeedbackCount(formId)

  return ApiService.get<FormFeedbackDto[]>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/feedback/download`,
  ).then(({ data }) => {
    const csvGenerator = new FeedbackCsvGenerator(expectedNumResponses)

    data.forEach((feedback) => {
      csvGenerator.addLineFromFeedback(feedback)
    })

    csvGenerator.triggerFileDownload(`${formTitle}-${formId}-feedback.csv`)
  })
}
