import { DisplayedResponseWithoutAnswer } from 'src/types'

import { Response } from './Response.class'

export class ErrorResponse extends Response {
  constructor(responseData: DisplayedResponseWithoutAnswer) {
    super(responseData)
  }

  getAnswer(): string {
    return 'error'
  }

  get numCols(): number {
    return 1
  }
}
