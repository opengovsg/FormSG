import { SingleResponse } from '../../../../../types/response'

import { Response } from './Response.class'

export class SingleAnswerResponse extends Response {
  private response: SingleResponse

  constructor(responseData: SingleResponse) {
    super(responseData)
    this.response = responseData
  }

  getAnswer(): string {
    return this.response.answer
  }

  get numCols(): number {
    return 1
  }
}
