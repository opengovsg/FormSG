import { DisplayedResponseWithoutAnswer } from '../../../../../types/response'

export abstract class Response {
  #data: DisplayedResponseWithoutAnswer

  constructor(responseData: DisplayedResponseWithoutAnswer) {
    this.#data = responseData
  }

  get id(): string {
    return this.#data._id
  }

  /**
   * Gets the CSV header.
   * @returns {string}
   */
  get question(): string {
    return this.#data.question
  }

  get isHeader(): boolean {
    return this.#data.isHeader ?? false
  }

  abstract get numCols(): number

  abstract getAnswer(colIndex?: number): string
}
