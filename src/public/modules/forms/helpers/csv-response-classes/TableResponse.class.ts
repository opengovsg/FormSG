import { NestedResponse } from '../../../../../types/response'

import { Response } from './Response.class'

export class TableResponse extends Response {
  #data: NestedResponse

  constructor(responseData: NestedResponse) {
    super(responseData)
    this.#data = responseData
  }

  getAnswer(colIndex: number): string {
    // Leave cell empty if number of rows is fewer than the index
    if (colIndex >= this.#data.answerArray.length) {
      return ''
    }
    return this.#data.answerArray[colIndex].join(';')
  }

  get numCols(): number {
    return this.#data.answerArray.length
  }
}
