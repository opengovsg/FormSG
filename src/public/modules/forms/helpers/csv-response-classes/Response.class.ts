import { DisplayedResponse } from '../../../../../types/response'

export abstract class Response {
  _data: DisplayedResponse

  constructor(responseData: DisplayedResponse) {
    this._data = responseData
  }

  get id(): string {
    return this._data._id
  }

  /**
   * Gets the CSV header.
   * @returns {string}
   */
  get question(): string {
    return this._data.question
  }

  get isHeader(): boolean {
    return this._data.isHeader ?? false
  }

  abstract get numCols(): number

  abstract getAnswer(colIndex?: number): string
}
