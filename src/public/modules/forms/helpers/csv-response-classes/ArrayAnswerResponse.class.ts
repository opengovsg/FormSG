import { AnswerArray, DisplayedResponse } from '../../../../../types/response'

import { Response } from './Response.class'

interface SingleDimResponse extends Omit<DisplayedResponse, 'answerArray'> {
  answerArray: Extract<AnswerArray, string[]>
}

export class ArrayAnswerResponse extends Response {
  constructor(responseData: SingleDimResponse) {
    super(responseData)
  }

  getAnswer(): string {
    return this._data.answerArray.join(';')
  }

  get numCols(): number {
    return 1
  }
}
