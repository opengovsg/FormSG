import { NestedResponse } from '../../../../../types/response'

import { Response } from './Response.class'

export class TableResponse extends Response {
  _data: NestedResponse

  constructor(responseData: NestedResponse) {
    super(responseData)
    this._data = responseData
  }

  getAnswer(colIndex: number): string {
    // Leave cell empty if number of rows is fewer than the index
    if (colIndex >= this._data.answerArray.length) {
      return ''
    }
    return this._data.answerArray[colIndex].join(';')
  }

  get numCols(): number {
    return this._data.answerArray.length
  }
}
