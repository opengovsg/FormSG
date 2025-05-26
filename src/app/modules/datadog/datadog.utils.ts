import tracer from 'dd-trace'

import { IPopulatedForm } from '../../../types'
import { ApplicationError } from '../core/core.errors'

export const setFormTags = (form: IPopulatedForm) => {
  const span = tracer.scope().active()

  if (span) {
    span.setTag('form.id', `${form._id}`)
    span.setTag('form.adminid', `${form.admin._id}`)
    span.setTag('form.agency.id', `${form.admin.agency._id}`)
    span.setTag('form.agency.shortname', `${form.admin.agency.shortName}`)
  }
}

/**
 * Sets the tags for the current active span. Should be called by a top-level
 * controller.
 * @param error The error to set the tags for
 */
export const setErrorCode = (error: ApplicationError) => {
  const span = tracer.scope().active()
  if (span && error.code) {
    span.setTag('error.type', error.code)
    span.setTag('error.message', `[${error.code}] ${error.message}`)
    if (error.stack) span.setTag('error.stack', `${error.stack}`)
  }
}
