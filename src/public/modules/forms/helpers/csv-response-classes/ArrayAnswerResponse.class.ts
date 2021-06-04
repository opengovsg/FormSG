import { SingleDimResponse } from '../../../../../types/response'

import { Response } from './Response.class'

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
