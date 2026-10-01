import { compareAsc, isValid, parseISO } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import type { Dictionary } from 'lodash'
import { keyBy } from 'lodash'
import type { Merge } from 'type-fest'

import { BasicField } from 'formsg-shared/types'
import { SIGNATURE_CAPTURED_STRING } from 'formsg-shared/utils/signature'

import {
  CSV_FIXED_COLUMN_IDS,
  MRF_RESPONSE_TIMESTAMP_LABEL,
} from '~features/admin-form/responses/constants'

import { CsvGenerator } from '../../../../common/utils'
import {
  matchesSearchQuery,
  normaliseSearchQuery,
} from '../../../../common/utils/responseSearch'
import type { DecryptedSubmissionData } from '../../types'
import type { Response } from '../csv-response-classes'
import {
  compareAnswers,
  CsvExportView,
  directionFactor,
  EXPORT_RESPONSE_ID_COLUMN_ID,
  isTimestampColumnId,
} from '../csvExportView'
import {
  getAddressDecryptedResponseInstances,
  getDecryptedResponseInstance,
} from '../getDecryptedResponseInstance'
import { processFormulaInjectionText } from '../processFormulaInjection'

type UnprocessedRecord = Merge<
  DecryptedSubmissionData,
  { record: Dictionary<Response> }
>

const MRF_CSV_HEADERS = ['Response ID', MRF_RESPONSE_TIMESTAMP_LABEL]

const BASE_CSV_HEADERS = ['Response ID', 'Timestamp']

export class EncryptedResponseCsvGenerator extends CsvGenerator {
  hasBeenProcessed: boolean
  hasBeenSorted: boolean
  fieldIdToQuestion: Map<string, { created: string; question: string }>
  fieldIdToNumCols: Record<string, number>
  unprocessed: UnprocessedRecord[]
  isMrf: boolean
  view: CsvExportView

  constructor(
    expectedNumberOfRecords: number,
    numOfMetaDataRows: number,
    isMrf: boolean,
    view: CsvExportView = {},
  ) {
    super(expectedNumberOfRecords, numOfMetaDataRows)

    this.view = view

    this.hasBeenProcessed = false
    this.hasBeenSorted = false
    this.fieldIdToQuestion = new Map()
    this.fieldIdToNumCols = {}
    this.unprocessed = []
    this.isMrf = isMrf
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
  addRecord({
    record,
    created,
    ...otherSubmissionProperties
  }: DecryptedSubmissionData): void {
    // Checked before any of the record is built, so a row the search excludes
    // costs nothing and cannot widen the header set.
    if (!this._matchesSearch(record, otherSubmissionProperties.submissionId)) {
      return
    }

    const fieldRecords: Response[] = []
    // First pass, create object with { [fieldId]: question } from
    // decryptedContent to get all the questions.
    record.forEach((content) => {
      //split address record into individual columns
      if (content.fieldType.toString() === 'address') {
        const addressFieldRecords: Response[] =
          getAddressDecryptedResponseInstances(content) // returns a list of Responses
        addressFieldRecords.forEach((fieldRecord) => {
          this._prepareFieldResponse(fieldRecord, created)
          fieldRecords.push(fieldRecord)
        })
        return //skip to next record in fieldRecords
      }

      // Populate signature field name with default string
      if (content.fieldType === BasicField.Signature) {
        if (content.answerArray && content.answerArray.length > 0)
          content.answerArray = [SIGNATURE_CAPTURED_STRING]
      }

      const fieldRecord = getDecryptedResponseInstance(content)
      this._prepareFieldResponse(fieldRecord, created)
      fieldRecords.push(fieldRecord)
      // return fieldRecord
    })

    // Rearrange record to be an object identified by field ID.
    this.unprocessed.push({
      created,
      record: keyBy(fieldRecords, (fieldRecord) => fieldRecord.id),
      ...otherSubmissionProperties,
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
    // NOTE: de-structuring is necessary to avoid mutating the array referenced by the `headers` array below.
    // See: https://github.com/opengovsg/FormSG/pull/7965#discussion_r1883954194.
    const visibleFieldIds = this._visibleFieldIds()
    const headers = this.isMrf ? [...MRF_CSV_HEADERS] : [...BASE_CSV_HEADERS]
    visibleFieldIds.forEach((fieldId) => {
      const question = this.fieldIdToQuestion.get(fieldId)?.question ?? ''
      for (let i = 0; i < this.fieldIdToNumCols[fieldId]; i++) {
        // TODO: (Code quality) Refactor to avoid mutating the `headers` array.
        headers.push(question)
      }
    })
    this.setHeader(headers)

    // Craft a new csv row for each unprocessed record
    // O(qn), where q = number of unique questions, n = number of submissions.
    this.unprocessed.forEach((up) => {
      const row = [up.submissionId]

      const formattedDate = isValid(parseISO(up.created))
        ? formatInTimeZone(
            up.created,
            'Asia/Singapore',
            'dd MMM yyyy hh:mm:ss a',
          )
        : up.created

      row.push(formattedDate)

      // TODO(FRM-1933): disabled lastSubmittedAt as we are undecided on showing firstSubmission vs lastSubmittedAt
      // if (this.isMrf) {
      //   const lastSubmittedAt = up.mrfMeta?.lastSubmittedAt
      //   if (lastSubmittedAt) {
      //     formattedDate = isValid(parseISO(lastSubmittedAt))
      //       ? formatInTimeZone(
      //           lastSubmittedAt,
      //           'Asia/Singapore',
      //           'dd MMM yyyy hh:mm:ss a',
      //         )
      //       : lastSubmittedAt
      //   }
      // }

      visibleFieldIds.forEach((fieldId) => {
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
   * Prepares a fieldRecord
   */
  private _prepareFieldResponse(fieldRecord: Response, created: string): void {
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
   * Orders records by the column the table was sorted on, and from oldest to
   * newest when it was not sorted at all.
   */
  sort(): void {
    if (this.hasBeenSorted) return

    const { sortColumnId, sortDirection } = this.view
    if (sortColumnId) {
      const factor = directionFactor(sortDirection)
      this.unprocessed.sort(
        (a, b) => factor * this._compareByColumn(a, b, sortColumnId),
      )
    } else {
      this.unprocessed.sort((a, b) =>
        this._dateComparator(a.created, b.created),
      )
    }

    this.hasBeenSorted = true
  }

  /**
   * Matched against the stored answers rather than the rendered cells, which is
   * as close as the export gets to what the table was showing.
   */
  private _matchesSearch(
    record: DecryptedSubmissionData['record'],
    submissionId: string,
  ): boolean {
    const query = normaliseSearchQuery(this.view.searchText ?? '')
    if (!query) return true

    const excluded = new Set(this.view.excludedSearchColumnIds ?? [])
    const values: string[] = []
    if (!excluded.has(EXPORT_RESPONSE_ID_COLUMN_ID)) values.push(submissionId)

    record.forEach((content) => {
      if (excluded.has(content._id)) return
      if (content.answerArray) {
        values.push(...content.answerArray.flat())
        return
      }
      if (content.answer) values.push(content.answer)
    })

    return matchesSearchQuery(values, query)
  }

  /** Ascending. `sort` applies the direction. */
  private _compareByColumn(
    a: UnprocessedRecord,
    b: UnprocessedRecord,
    columnId: string,
  ): number {
    if (isTimestampColumnId(columnId)) {
      return this._dateComparator(a.created, b.created)
    }
    if (columnId === EXPORT_RESPONSE_ID_COLUMN_ID) {
      return compareAnswers(a.submissionId, b.submissionId)
    }
    return compareAnswers(
      this._extractAnswer(a.record, columnId, 0),
      this._extractAnswer(b.record, columnId, 0),
    )
  }

  /** Field ids to emit, in header order, with the hidden ones dropped. */
  private _visibleFieldIds(): string[] {
    const hidden = new Set(this.view.hiddenColumnIds ?? [])
    const visible = Array.from(this.fieldIdToQuestion.keys()).filter(
      (fieldId) => !hidden.has(fieldId),
    )
    // The fixed pseudo-columns (download status, workflow status, pending
    // response at) keep their canonical position regardless of which record
    // introduced them — on a mode-migrated form the first-decrypted row may
    // be a pre-migration encrypt row that carries no mrf columns, which
    // would otherwise push them behind the response and payment columns.
    const visibleSet = new Set(visible)
    const fixed = CSV_FIXED_COLUMN_IDS.filter((fieldId) =>
      visibleSet.has(fieldId),
    )
    return [
      ...fixed,
      ...visible.filter((fieldId) => !CSV_FIXED_COLUMN_IDS.includes(fieldId)),
    ]
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
    const first = fromZonedTime(firstDate, 'Asia/Singapore')
    const second = fromZonedTime(secondDate, 'Asia/Singapore')
    return compareAsc(first, second)
  }
}
