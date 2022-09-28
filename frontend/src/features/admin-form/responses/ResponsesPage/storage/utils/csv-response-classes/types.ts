/**
 * Types used to determine decrypted responses
 */
export type DisplayedResponseWithoutAnswer = {
  _id: string
  question: string
  fieldType: string
  isHeader?: boolean
}

export type ArrayResponse = DisplayedResponseWithoutAnswer & {
  answerArray: string[]
}

export type NestedResponse = DisplayedResponseWithoutAnswer & {
  answerArray: string[][]
}
export type SingleResponse = DisplayedResponseWithoutAnswer & {
  answer: string
}
