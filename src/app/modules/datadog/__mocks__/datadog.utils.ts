import { IPopulatedForm } from 'src/types'

import { ApplicationError } from '../../core/core.errors'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const setFormTags = (_form: IPopulatedForm) => {
  return
}

/**
 * Sets the tags for the current active span. Should be called by a top-level
 * controller.
 * @param _error The error to set the tags for
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const setErrorCode = (_error: ApplicationError) => {
  return
}
