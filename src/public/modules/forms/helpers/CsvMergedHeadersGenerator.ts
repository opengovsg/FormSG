import { keyBy } from 'lodash'
import moment from 'moment-timezone'
import { Dictionary } from 'ts-essentials/dist/types'

import { DisplayedResponse } from 'src/types/response'

import { Response } from './csv-response-classes'
import { CsvGenerator } from './CsvGenerator'
import { getResponseInstance } from './response-factory'

type UnprocessedRecord = {
  created: string
  submissionId: string
  record: ReturnType<typeof keyBy>
}

export class CsvMergedHeadersGenerator extends CsvGenerator {
  hasBeenProcessed: boolean
  fieldIdToQuestion: Map<
    string,
    {
      created: string
      question: string
    }
  >
  fieldIdToNumCols: Record<string, number>
  unprocessed: UnprocessedRecord[]

  constructor(expectedNumberOfRecords: number, numOfMetaDataRows: number) {
    super(expectedNumberOfRecords, numOfMetaDataRows)

    this.hasBeenProcessed = false
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
   * Adds an UnprocessedRecord to this.unprocessed
   * @param {Object} decryptedContent
   * @param {DisplayedResponse[]} decryptedContent.record
   * @param {string} decryptedContent.created
   * @param {string} decryptedContent.submissionId
   */
  addRecord({
    record,
    created,
    submissionId,
  }: {
    record: DisplayedResponse[]
    created: string
    submissionId: string
  }): void {
    // First pass, create object with { [fieldId]: question } from
    // decryptedContent to get all the questions.
    const fieldRecords = record.map((content) => {
      const fieldRecord = getResponseInstance(content)
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
   * Extracts the string representation from an unprocessed record.
   * @param {Object} unprocessedRecord
   * @param {string} fieldId
   * @param {number} colIndex
   * @returns {string}
   */
  _extractAnswer(
    unprocessedRecord: Dictionary<Response>,
    fieldId: string,
    colIndex: number,
  ): string {
    const fieldRecord = unprocessedRecord[fieldId]
    if (!fieldRecord) return ''
    return fieldRecord.getAnswer(colIndex)
  }

  /**
   * Process the unprocessed records by creating the correct headers and
   * assigning each answer to their respective locations in each response row in
   * the csv data.
   */
  process(): void {
    if (this.hasBeenProcessed) return

    // Create a header row in CSV using the fieldIdToQuestion map.
    const headers = ['Reference number', 'Timestamp']
    this.fieldIdToQuestion.forEach((value, fieldId) => {
      for (let i = 0; i < this.fieldIdToNumCols[fieldId]; i++) {
        headers.push(value.question)
      }
    })
    this.setHeader(headers)

    // Craft a new csv row for each unprocessed record
    // O(qn), where q = number of unique questions, n = number of submissions.
    this.unprocessed.forEach((up) => {
      const createdAt = moment(up.created).tz('Asia/Singapore')
      const formattedDate = createdAt.isValid()
        ? createdAt.format('DD MMM YYYY hh:mm:ss A')
        : createdAt.toString() // just convert to string if given date is not valid
      const row = [up.submissionId, formattedDate]

      this.fieldIdToQuestion.forEach(
        (_question: { created: string; question: string }, fieldId: string) => {
          const numCols = this.fieldIdToNumCols[fieldId]
          for (let colIndex = 0; colIndex < numCols; colIndex++) {
            row.push(this._extractAnswer(up.record, fieldId, colIndex))
          }
        },
      )
      this.addLine(row)
    })

    this.hasBeenProcessed = true
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
   * @param {string} filename
   */
  downloadCsv(filename: string): void {
    this.process()
    this.triggerFileDownload(filename)
  }
}
