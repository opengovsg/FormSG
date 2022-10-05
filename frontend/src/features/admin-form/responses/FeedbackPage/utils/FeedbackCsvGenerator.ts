import { isValid, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

import { FormFeedbackDto } from '~shared/types'

import { CsvGenerator } from '../../common/utils/CsvGenerator'
import { processFormulaInjectionText } from '../../ResponsesPage/storage/utils/processFormulaInjection'
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

    const feedbackComment = feedback.comment
      ? processFormulaInjectionText(feedback.comment)
      : ''

    this.addLine([createdAt, feedbackComment, feedback.rating])
  }
}
