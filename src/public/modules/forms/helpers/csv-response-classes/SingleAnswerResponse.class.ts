import { SingleResponse } from '../../../../../types/response'

import { Response } from './Response.class'

export class SingleAnswerResponse extends Response {
  _data: SingleResponse

  constructor(responseData: SingleResponse) {
    super(responseData)
    this._data = responseData
  }

  getAnswer(): string {
    return this._data.answer
  }

  get numCols(): number {
    return 1
  }
}
