import { ArrayResponse } from '../../../../../types/response'

import { Response } from './Response.class'

export class ArrayAnswerResponse extends Response {
  #data: ArrayResponse

  constructor(responseData: ArrayResponse) {
    super(responseData)
    this.#data = responseData
  }

  getAnswer(): string {
    return this.#data.answerArray.join(';')
  }

  get numCols(): number {
    return 1
  }
}
