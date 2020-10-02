import _ from 'lodash'

/**
 * Business definition of whether a supplied answer for a response is empty.
 * Implementation is identical to previous instance method _isValueEmpty
 * except for the introduction of lodash.
 * @param answer
 */
export const isAnswerEmpty = (answer: string | undefined | null): boolean => {
  return (
    _.isUndefined(answer) ||
    _.isNull(answer) ||
    (typeof answer === 'string' && answer.trim() === '')
  )
}
