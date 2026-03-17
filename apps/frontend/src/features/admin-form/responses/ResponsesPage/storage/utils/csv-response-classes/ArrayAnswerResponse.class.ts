import { Response } from './Response.class'
import type { ArrayResponse } from './types'

export class ArrayAnswerResponse extends Response {
  private response: ArrayResponse

  constructor(responseData: ArrayResponse) {
    super(responseData)
    this.response = responseData
  }

  getAnswer(): string {
    return this.response.answerArray.join(';')
  }

  get numCols(): number {
    return 1
  }
}
