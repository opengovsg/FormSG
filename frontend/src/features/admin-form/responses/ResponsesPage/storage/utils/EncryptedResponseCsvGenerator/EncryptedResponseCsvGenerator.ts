import { compareAsc, isValid, parseISO } from 'date-fns'
import { formatInTimeZone, zonedTimeToUtc } from 'date-fns-tz'
import type { Dictionary } from 'lodash'
import { keyBy } from 'lodash'
import type { Merge } from 'type-fest'

import { CsvGenerator } from '../../../../common/utils'
import type { DecryptedSubmissionData } from '../../types'
import type { Response } from '../csv-response-classes'
import { getDecryptedResponseInstance } from '../getDecryptedResponseInstance'
import { processFormulaInjectionText } from '../processFormulaInjection'

type UnprocessedRecord = Merge<
  DecryptedSubmissionData,
  { record: Dictionary<Response> }
>

export class EncryptedResponseCsvGenerator extends CsvGenerator {
  hasBeenProcessed: boolean
  hasBeenSorted: boolean
  fieldIdToQuestion: Map<string, { created: string; question: string }>
  fieldIdToNumCols: Record<string, number>
  unprocessed: UnprocessedRecord[]

  constructor(expectedNumberOfRecords: number, numOfMetaDataRows: number) {
    super(expectedNumberOfRecords, numOfMetaDataRows)

    this.hasBeenProcessed = false
    this.hasBeenSorted = false
    this.fieldIdToQuestion = new Map()
    this.fieldIdToNumCols = {}
    this.unprocessed = []
  }

  /**
   * Returns current length of CSV file excluding header and meta-data
   */
  length(): number {
    return this.unprocessed.length
  }

  /**
   * Extracts information from input record, rearranges record and then adds an UnprocessedRecord to `this.unprocessed`
   * @throws Error when trying to convert record into a response instance. Should be caught in submissions client factory.
   */
  addRecord({ record, created, submissionId }: DecryptedSubmissionData): void {
    // First pass, create object with { [fieldId]: question } from
    // decryptedContent to get all the questions.
    const fieldRecords = record.map((content) => {
      const fieldRecord = getDecryptedResponseInstance(content)
      if (!fieldRecord.isHeader) {
        const currentMapping = this.fieldIdToQuestion.get(fieldRecord.id)
        // Only set new mapping if it does not exist or this record is a later
        // submission.
        // Might need to differentiate the question headers if we allow
        // signed-but-failed-verification rows to proceed.
        if (!currentMapping || created > currentMapping.created) {
          this.fieldIdToQuestion.set(fieldRecord.id, {
            created,
            question: fieldRecord.question,
          })
        }
        // Number of columns needed by this answer in the CSV
        const contentNumCols = fieldRecord.numCols
        // Number of columns currently allocated to the field
        const currentNumCols = this.fieldIdToNumCols[fieldRecord.id]
        // Update the number of columns allocated
        this.fieldIdToNumCols[fieldRecord.id] = currentNumCols
          ? Math.max(currentNumCols, contentNumCols)
          : contentNumCols
      }
      return fieldRecord
    })

    // Rearrange record to be an object identified by field ID.
    this.unprocessed.push({
      created,
      submissionId,
      record: keyBy(fieldRecords, (fieldRecord) => fieldRecord.id),
    })
  }

  /**
   * Process the unprocessed records by creating the correct headers and
   * assigning each answer to their respective locations in each response row in
   * the csv data.
   */
  process(): void {
    if (this.hasBeenProcessed) return

    // Create a header row in CSV using the fieldIdToQuestion map.
    const headers = ['Response ID', 'Timestamp']
    this.fieldIdToQuestion.forEach((value, fieldId) => {
      for (let i = 0; i < this.fieldIdToNumCols[fieldId]; i++) {
        headers.push(value.question)
      }
    })
    this.setHeader(headers)

    // Craft a new csv row for each unprocessed record
    // O(qn), where q = number of unique questions, n = number of submissions.
    this.unprocessed.forEach((up) => {
      const formattedDate = isValid(parseISO(up.created))
        ? formatInTimeZone(
            up.created,
            'Asia/Singapore',
            'dd MMM yyyy hh:mm:ss a',
          )
        : up.created
      const row = [up.submissionId, formattedDate]

      this.fieldIdToQuestion.forEach((_question, fieldId) => {
        const numCols = this.fieldIdToNumCols[fieldId]
        for (let colIndex = 0; colIndex < numCols; colIndex++) {
          row.push(this._extractAnswer(up.record, fieldId, colIndex))
        }
      })
      this.addLine(row)
    })
    this.hasBeenProcessed = true
  }

  /**
   * Extracts the string representation from a field response
   * @param unprocessedRecord
   * @param fieldId
   * @param colIndex
   * @returns string representation of unprocessed record
   */
  private _extractAnswer(
    unprocessedRecord: UnprocessedRecord['record'],
    fieldId: string,
    colIndex: number,
  ): string {
    const fieldRecord = unprocessedRecord[fieldId]
    if (!fieldRecord) return ''
    return processFormulaInjectionText(fieldRecord.getAnswer(colIndex))
  }

  /**
   * Sorts unprocessed records from oldest to newest
   */
  sort(): void {
    if (this.hasBeenSorted) return
    this.unprocessed.sort((a, b) => this._dateComparator(a.created, b.created))
    this.hasBeenSorted = true
  }

  /**
   * Add meta-data as first three rows of the CSV. If there is already meta-data
   * added, it will be replaced by the latest counts.
   */
  addMetaDataFromSubmission(errorCount: number, unverifiedCount: number): void {
    const metaDataRows = [
      ['Expected total responses', this.expectedNumberOfRecords],
      ['Success count', this.length()],
      ['Error count', errorCount],
      ['Unverified response count', unverifiedCount],
      ['See download status column for download errors'],
    ]
    this.addMetaData(metaDataRows)
  }

  /**
   * Main method to call to retrieve a downloadable csv.
   * @param filename name of csv file
   */
  downloadCsv(filename: string): void {
    this.sort()
    this.process()
    this.triggerFileDownload(filename)
  }

  /**
   * Comparator for dates
   * @param firstDate first date to compare
   * @param secondDate second date to compare
   * @returns -1 if firstDate is earlier than secondDate, 0 if they are equal, 1 if firstDate is later than secondDate
   */
  private _dateComparator(firstDate: string, secondDate: string): number {
    // cast to Asia/Singapore to ensure both dates are of the same timezone
    const first = zonedTimeToUtc(firstDate, 'Asia/Singapore')
    const second = zonedTimeToUtc(secondDate, 'Asia/Singapore')
    return compareAsc(first, second)
  }
}
