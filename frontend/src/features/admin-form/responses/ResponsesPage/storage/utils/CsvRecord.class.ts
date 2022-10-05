import { cloneDeep } from 'lodash'

import {
  CsvRecordData,
  CsvRecordStatus,
  DecryptedSubmissionData,
} from '../types'

/** @class CsvRecord represents the CSV data to be passed back, along with helper functions */
export class CsvRecord {
  downloadBlob?: Blob
  submissionData?: DecryptedSubmissionData

  #statusMessage: string
  #record: CsvRecordData[]

  /**
   * Creates an instance of CsvRecord
   *
   * @constructor
   * @param id The ID of the submission
   * @param created The time of submission
   * @param status The status of the submission decryption/download process
   */
  constructor(
    public id: string,
    public created: string,
    public status: CsvRecordStatus,
  ) {
    this.#statusMessage = status
    this.#record = []
  }

  /**
   * Sets the decryption/download status
   *
   * @param status A status code indicating the decryption success to be consumed by submissions.client.factory.js
   * @param msg A human readable status message to be presented as part of the CSV download
   */
  setStatus(status: CsvRecordStatus, msg: string) {
    this.status = status
    this.#statusMessage = msg
  }

  /**
   * Sets the ZIP attachment blob to be downloaded
   *
   * @param blob A blob containing a ZIP file of all the submission attachments downloaded
   */
  setDownloadBlob(blob: Blob) {
    this.downloadBlob = blob
  }

  /**
   * Sets the decrypted CSV record
   *
   * @param record The decrypted submission record
   */
  setRecord(record: CsvRecordData[]) {
    this.#record = record
  }

  /**
   * Materializes the `submissionData` field
   *
   * This function should be called before the CsvRecord is passed back using `postMessage`.
   * Since `postMessage` does not support code being passed back to the main thread, the
   * `CsvRecord` received will only contain simple fields (e.g. `created`, `status`, etc...).
   *
   * This function creates a `submissionData` field in the object containing the final
   * answers to be added to the CSV file. This `submissionData` field will be passed back
   * using `postMessage` since it does not contain code.
   */
  materializeSubmissionData() {
    const downloadStatus: CsvRecordData = {
      _id: '000000000000000000000000',
      fieldType: 'textfield',
      question: 'Download Status',
      answer: this.#statusMessage,
    }
    const output = cloneDeep(this.#record)
    output.unshift(downloadStatus)

    this.submissionData = {
      created: this.created,
      submissionId: this.id,
      record: output,
    }
  }
}
