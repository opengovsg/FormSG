import { withTranslation } from 'react-i18next'
import { isValid, parseISO } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import i18next from 'i18next'

import { FormFeedbackDto } from '~shared/types'

import { CsvGenerator } from '../../common/utils/CsvGenerator'
import { processFormulaInjectionText } from '../../ResponsesPage/storage/utils/processFormulaInjection'
/**
 * Class to encapsulate the FeedbackCsv and its attributes
 */
export class FeedbackCsvGenerator extends CsvGenerator {
  constructor(expectedNumberOfRecords: number) {
    super(expectedNumberOfRecords, 0)
    this.setHeader([
      i18next.t('features.adminForm.feedback.feedbackCsvGenerator.date'),
      i18next.t('features.adminForm.feedback.feedbackCsvGenerator.comment'),
      i18next.t('features.adminForm.feedback.feedbackCsvGenerator.rating'),
    ])
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
