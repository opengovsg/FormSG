import { DisplayedResponse } from '../../../../../types/response'

import { Response } from './Response.class'

export class SingleAnswerResponse extends Response {
  constructor(responseData: DisplayedResponse) {
    super(responseData)
  }

  getAnswer(): string {
    return this._data.answer ?? ''
  }

  get numCols(): number {
    return 1
  }
}
