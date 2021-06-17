import { SingleResponse } from '../../../../../types/response'

import { Response } from './Response.class'

export class SingleAnswerResponse extends Response {
  #data: SingleResponse

  constructor(responseData: SingleResponse) {
    super(responseData)
    this.#data = responseData
  }

  getAnswer(): string {
    return this.#data.answer
  }

  get numCols(): number {
    return 1
  }
}
