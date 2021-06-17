import { NestedResponse } from '../../../../../types/response'

import { Response } from './Response.class'

export class TableResponse extends Response {
  private response: NestedResponse

  constructor(responseData: NestedResponse) {
    super(responseData)
    this.response = responseData
  }

  getAnswer(colIndex: number): string {
    // Leave cell empty if number of rows is fewer than the index
    if (colIndex >= this.response.answerArray.length) {
      return ''
    }
    return this.response.answerArray[colIndex].join(';')
  }

  get numCols(): number {
    return this.response.answerArray.length
  }
}
