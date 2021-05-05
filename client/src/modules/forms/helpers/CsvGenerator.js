const { stringify } = require('csv-string')
const { triggerFileDownload } = require('./util')

// Used to denote to Excel that the CSV is UTF8-encoded. See
// https://stackoverflow.com/questions/19492846/javascript-to-csv-export-encoding-issue
// for more information.
const UTF8_BYTE_ORDER_MARK = '\uFEFF'

module.exports = class CsvGenerator {
  constructor(expectedNumberOfRecords = 0, numOfMetaDataRows = 0) {
    this.expectedNumberOfRecords = expectedNumberOfRecords
    this.numOfMetaDataRows = numOfMetaDataRows
    this.numOfHeaderRows = 1
    this.lastCreatedAt = 0

    // Index to start inserting new data into.
    // (Assume 1 row for header and 1 for the byte order mark.)
    this.startIdx = this.numOfMetaDataRows + this.numOfHeaderRows + 1
    // Index to insert next row data into.
    this.idx = this.startIdx
    // Preallocate for performance.
    this.records = Array(this.startIdx + this.expectedNumberOfRecords).fill('')
    // Must be added first for Excel to know that this file is an UTF8-encoded
    // CSV.
    this.records[0] = UTF8_BYTE_ORDER_MARK
  }

  /**
   * Insert raw data for a given row into the CSV file
   * @param {Array} rowData array of data to be inserted
   */
  addLine(rowData) {
    this.records[this.idx] = stringify(rowData)
    this.idx++
  }

  /**
   * Insert headers into the CSV file after the meta-data
   * @param {Array} headerLabels array of labels for header row
   */
  setHeader(headerLabels) {
    this.records[this.startIdx - 1] = stringify(headerLabels)
  }

  /**
   * Insert meta-data array into the start of the CSV file
   * @param {Array} metaDataRows array of arrays, metaDataRows[i][j] holds the data for row i, col j of the metaData table
   */
  addMetaData(metaDataRows) {
    const metaData = metaDataRows.map((data) => stringify(data))
    // Start splicing at index 1 because BOM is at index 0.
    this.records.splice(1, this.numOfMetaDataRows, ...metaData)
  }

  /**
   * Download CSV file
   * @param {string} fileName
   */
  triggerFileDownload(fileName) {
    const blob = new Blob(this.records, {
      type: 'text/csv;charset=utf-8',
    })
    triggerFileDownload(blob, fileName)
  }

  /**
   * Returns current length of CSV file excluding header and meta-data
   */
  length() {
    return this.idx - this.startIdx
  }
}
