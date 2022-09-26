import { isValid, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

import { FormFeedbackDto } from '~shared/types'

import { CsvGenerator } from '../../common/utils/CsvGenerator'
import {
  FORMULA_INJECTION_REGEXP,
  PURE_NUMBER_REGEXP,
} from '../../ResponsesPage/storage/utils/EncryptedResponseCsvGenerator/EncryptedResponseCsvGenerator'
/**
 * Class to encapsulate the FeedbackCsv and its attributes
 */
export class FeedbackCsvGenerator extends CsvGenerator {
  constructor(expectedNumberOfRecords: number) {
    super(expectedNumberOfRecords, 0)
    this.setHeader(['Date', 'Comment', 'Rating'])
  }

  /**
   * Generate a string representing a form feedback CSV line record
   */
  addLineFromFeedback(feedback: FormFeedbackDto) {
    const feedbackCreatedDate =
      feedback.created && isValid(parseISO(feedback.created))
        ? feedback.created
        : new Date() // If undefined or invalid, use current time
    const createdAt = formatInTimeZone(
      feedbackCreatedDate,
      'Asia/Singapore',
      'dd MMM yyyy hh:mm:ss a',
    ) // Format in SG timezone

    let feedbackComment = ''
    if (feedback.comment) {
      // Check if fieldRecord is a pure number
      const isPureNumber = PURE_NUMBER_REGEXP.test(feedback.comment)
      // Check if fieldRecord starts with formula characters
      const hasFormulaChars = FORMULA_INJECTION_REGEXP.test(feedback.comment)
      // if fieldRecord is not a pure number, and starts with formula characters,
      // prefix it with a single quote to prevent formula injection
      if (!isPureNumber && hasFormulaChars) {
        feedbackComment = `'${feedback.comment}`
      } else feedbackComment = feedback.comment
    }

    this.addLine([createdAt, feedbackComment, feedback.rating])
  }
}
