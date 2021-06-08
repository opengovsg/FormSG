import { DisplayedResponseWithoutAnswer } from '../../../../../types/response'

import { Response } from './Response.class'

interface SingleResponse extends DisplayedResponseWithoutAnswer {
  answer: string
}
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
