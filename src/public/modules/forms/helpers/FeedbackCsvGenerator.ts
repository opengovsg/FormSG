import moment from 'moment-timezone'

import { FormFeedbackResponseDto } from '../../../../types/api/form-feedback'

import { CsvGenerator } from './CsvGenerator'

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
  addLineFromFeedback(feedback: FormFeedbackResponseDto) {
    const createdAt = moment(feedback.created)
      .tz('Asia/Singapore')
      .format('DD MMM YYYY hh:mm:ss A')

    this.addLine([createdAt, feedback.comment || '', feedback.rating])
  }
}
