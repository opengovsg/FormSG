import { AnswerArray, DisplayedResponse } from '../../../../../types/response'

import { Response } from './Response.class'

export interface TwoDimResponse extends Omit<DisplayedResponse, 'answerArray'> {
  answerArray: Extract<AnswerArray, string[][]>
}

export class TableResponse extends Response {
  constructor(responseData: TwoDimResponse) {
    super(responseData)
  }

  getAnswer(colIndex: number): string {
    // Leave cell empty if number of rows is fewer than the index
    if (colIndex >= this._data.answerArray.length) {
      return ''
    }
    return (this._data as TwoDimResponse).answerArray[colIndex].join(';')
  }

  get numCols(): number {
    return this._data.answerArray.length
  }
}
