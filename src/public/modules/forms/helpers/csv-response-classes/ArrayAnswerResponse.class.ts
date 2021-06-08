import { ArrayResponse } from '../../../../../types/response'

import { Response } from './Response.class'

export class ArrayAnswerResponse extends Response {
  _data: ArrayResponse

  constructor(responseData: ArrayResponse) {
    super(responseData)
    this._data = responseData
  }

  getAnswer(): string {
    return this._data.answerArray.join(';')
  }

  get numCols(): number {
    return 1
  }
}
