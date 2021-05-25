import axios from 'axios'
import moment from 'moment-timezone'

import { FormFeedbackPostDto } from '../../../../types'
import {
  FormFeedbackResponseDto,
  GetFormFeedbackDto,
} from '../../../../types/form_feedback'
import { CsvGenerator } from '../helpers/CsvGenerator'

// Exported for testing
export const PUBLIC_FORM_ENDPOINT = '/api/v3/forms'
export const ADMIN_FORM_ENDPOINT = '/api/v3/admin/forms'

/**
 * Post feedback for a given form.
 * @param formId the id of the form to post feedback for
 * @param feedbackToPost object containing the feedback
 * @returns the posted feedback
 */
export const postFeedback = async (
  formId: string,
  feedbackToPost: FormFeedbackPostDto,
): Promise<FormFeedbackResponseDto> => {
  return axios
    .post<FormFeedbackResponseDto>(
      `${PUBLIC_FORM_ENDPOINT}/${formId}/feedback`,
      feedbackToPost,
    )
    .then(({ data }) => data)
}

/**
 * Retrieves feedback for a given form.
 * @param formId the id of the form to retrieve feedback for
 * @returns object containing average?, count, and feedback[]
 */
export const getFeedback = async (
  formId: string,
): Promise<GetFormFeedbackDto> => {
  return axios
    .get<GetFormFeedbackDto>(`${ADMIN_FORM_ENDPOINT}/${formId}/feedback`)
    .then(({ data }) => data)
}

/**
 * Counts feedback for a given form.
 * @param formId the id of the form to count feedback for
 * @returns the count of the retrieved feedback
 */
export const countFeedback = async (formId: string): Promise<number> => {
  return axios
    .get<number>(`${ADMIN_FORM_ENDPOINT}/${formId}/feedback/count`)
    .then(({ data }) => data)
}

/**
 * Class to encapsulate the FeedbackCsv and its attributes
 */
class FeedbackCsvGenerator extends CsvGenerator {
  constructor(expectedNumberOfRecords: number) {
    super(expectedNumberOfRecords, 0)
    this.setHeader(['Date', 'Comment', 'Rating'])
  }

  /**
   * Generate a string representing a form feedback CSV line record
   * @param {IFormFeedbackDocument} feedback
   * @param {Date} feedback.created
   * @param {string} feedback.comment
   * @param {number} feedback.rating
   */
  addLineFromFeedback(feedback: FormFeedbackResponseDto) {
    const createdAt = moment(feedback.created)
      .tz('Asia/Singapore')
      .format('DD MMM YYYY hh:mm:ss A')

    this.addLine([createdAt, feedback.comment || '', feedback.rating])
  }
}

/**
 * Downloads feedback for a given form.
 * @param formId the id of the form to download feedback for
 * @returns a stream of feedback
 */
export const downloadFeedback = async (
  formId: string,
  formTitle: string,
): Promise<void> => {
  const expectedNumResponses = await countFeedback(formId)

  return axios
    .get<FormFeedbackResponseDto[]>(
      `${ADMIN_FORM_ENDPOINT}/${formId}/feedback/download`,
    )
    .then(({ data }) => {
      if (!data) {
        return Promise.reject(new Error('Feedback size too large to download'))
      }

      const csvGenerator = new FeedbackCsvGenerator(expectedNumResponses)

      data.forEach((feedback) => {
        csvGenerator.addLineFromFeedback(feedback)
      })

      csvGenerator.triggerFileDownload(`${formTitle}-${formId}-feedback.csv`)
      return Promise.resolve()
    })
}
