import { ISingleAnswerResponse } from '.'

export const isSingleAnswerResponse = (
  response: any,
): response is ISingleAnswerResponse => {
  return response && typeof response.answer === 'string'
}
