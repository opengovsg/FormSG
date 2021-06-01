const moment = require('moment-timezone')
const keyBy = require('lodash/keyBy')
const { CsvGenerator } = require('./CsvGenerator')
const { getResponseInstance } = require('./response-factory')

/**
 * @typedef {{
 *    _id: string,
 *    question: string,
 *    answer?: string,
 *    answerArray?: string[],
 *    fieldType: string,
 *    isHeader?: boolean,
 * }} DisplayedResponse
 */

class CsvMergedHeadersGenerator extends CsvGenerator {
  constructor(expectedNumberOfRecords, numOfMetaDataRows) {
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
  length() {
    return this.unprocessed.length
  }

  /**
   *
   * @param {Object} decryptedContent
   * @param {DisplayedResponse[]} decryptedContent.record
   * @param {string} decryptedContent.created
   * @param {string} decryptedContent.submissionId
   */
  addRecord({ record, created, submissionId }) {
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
   * @returns {string}
   */
  _extractAnswer(unprocessedRecord, fieldId, colIndex) {
    const fieldRecord = unprocessedRecord[fieldId]
    if (!fieldRecord) return ''
    return fieldRecord.getAnswer(colIndex)
  }

  /**
   * Process the unprocessed records by creating the correct headers and
   * assigning each answer to their respective locations in each response row in
   * the csv data.
   */
  process() {
    if (this.hasBeenProcessed) return

    // Create a header row in CSV using the fieldIdToQuestion map.
    let headers = ['Reference number', 'Timestamp']
    this.fieldIdToQuestion.forEach((value, fieldId) => {
      for (let i = 0; i < this.fieldIdToNumCols[fieldId]; i++) {
        headers.push(value.question)
      }
    })
    this.setHeader(headers)

    // Craft a new csv row for each unprocessed record
    // O(qn), where q = number of unique questions, n = number of submissions.
    this.unprocessed.forEach((up) => {
      let createdAt = moment(up.created).tz('Asia/Singapore')
      createdAt = createdAt.isValid()
        ? createdAt.format('DD MMM YYYY hh:mm:ss A')
        : createdAt
      let row = [up.submissionId, createdAt]
      for (let [fieldId] of this.fieldIdToQuestion) {
        const numCols = this.fieldIdToNumCols[fieldId]
        for (let colIndex = 0; colIndex < numCols; colIndex++) {
          row.push(this._extractAnswer(up.record, fieldId, colIndex))
        }
      }
      this.addLine(row)
    })
    this.hasBeenProcessed = true
  }

  /**
   * Sorts unprocessed records from oldest to newest
   */
  sort() {
    if (this.hasBeenSorted) return
    this.unprocessed.sort((a, b) => this._dateComparator(a.created, b.created))
    this.hasBeenSorted = true
  }

  /**
   * Add meta-data as first three rows of the CSV. If there is already meta-data
   * added, it will be replaced by the latest counts.
   */
  addMetaDataFromSubmission(errorCount, unverifiedCount) {
    let metaDataRows = [
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
  downloadCsv(filename) {
    this.sort()
    this.process()
    this.triggerFileDownload(filename)
  }

  /**
   * Comparator for dates
   * @param string firstDate
   * @param string secondDate
   */
  _dateComparator(firstDate, secondDate) {
    const first = moment(firstDate)
    const second = moment(secondDate)
    if (first.isBefore(second)) {
      return -1
    } else if (first.isAfter(second)) {
      return 1
    } else {
      // dates are the same
      return 0
    }
  }
}

module.exports = CsvMergedHeadersGenerator
