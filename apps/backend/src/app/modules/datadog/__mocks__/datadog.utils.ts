import { IPopulatedForm } from 'src/types'

import { ApplicationError } from '../../core/core.errors'

// oxlint-disable-next-line typescript/no-unused-vars
export const setFormTags = (_form: IPopulatedForm) => {
  return
}

/**
 * Sets the tags for the current active span. Should be called by a top-level
 * controller.
 * @param _error The error to set the tags for
 */
// oxlint-disable-next-line typescript/no-unused-vars
export const setErrorCode = (_error: ApplicationError) => {
  return
}

// oxlint-disable-next-line typescript/no-unused-vars
export const submitErrorCountMetric = (_errorCode: number) => {
  return
}
