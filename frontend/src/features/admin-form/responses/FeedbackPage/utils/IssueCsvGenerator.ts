import { isValid } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

import { FormIssueDto } from '~shared/types'

import { CsvGenerator } from '../../common/utils/CsvGenerator'
import { processFormulaInjectionText } from '../../ResponsesPage/storage/utils/processFormulaInjection'

/**
 * Class to encapsulate the IssueCsv and its attributes
 */
export class IssueCsvGenerator extends CsvGenerator {
  constructor(expectedNumberOfRecords: number) {
    super(expectedNumberOfRecords, 0)
    this.setHeader(['Date', 'Issue', 'Email'])
  }

  /**
   * Generate a string representing a form feedback CSV line record
   */
  addLineFromIssue(issue: FormIssueDto) {
    const issueCreatedDate =
      issue.created && isValid(new Date(issue.created))
        ? new Date(issue.created)
        : new Date() // If undefined or invalid, use current time
    const createdAt = formatInTimeZone(
      issueCreatedDate,
      'Asia/Singapore',
      'dd MMM yyyy hh:mm:ss a',
    ) // Format in SG timezone

    const issueComment = issue.issue
      ? processFormulaInjectionText(issue.issue)
      : ''

    this.addLine([createdAt, issueComment, issue.email ? issue.email : ''])
  }
}
