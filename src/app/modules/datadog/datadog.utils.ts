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
    span.setTag('span.error.type', error.code)
    span.setTag('span.error.message', `[${error.code}] ${error.message}`)
    if (error.stack) span.setTag('span.error.stack', `${error.stack}`)
  }
}

/**
 * Submits an error count metric to Datadog. Used for monitoring errors and dashboard visualizations.
 * @param errorCode The error code to submit the metric for
 */
export const submitErrorCountMetric = ({
  errorName,
  errorCode,
}: {
  errorName: string
  errorCode: number
}) => {
  tracer.dogstatsd.increment('formsg.error.count', 1, {
    code: errorCode,
    // NOTE: since the granularity is the same even when adding name (ie, the name is the same for each error code),
    // the number and hence cost of custom metrics is the same despite adding the name tag.
    // Avoid using the error message as it can frequently change, increasing the number and cost of custom metrics.
    name: `[${errorCode}] ${errorName}`,
  })
}

/**
 * Used to profile latency of a function.
 * @returns An object containing a stop function that returns the elapsed time in milliseconds
 */
export const startStopwatch = () => {
  const startTime = Date.now()
  return {
    stop: () => {
      const latency = Date.now() - startTime
      return latency
    }
  }
}

/**
 * Submits the latency for pdf generation to Datadog.
 * @param latencyMs The computed latency in milliseconds. 
 * @param isLocal Whether the pdf generation is for current local generation or using Lambda
 */
export const submitPdfGenerationLatencyMetric = ({
  latencyMs,
  isLocal, 
}: {
  latencyMs: number
  isLocal: boolean
}) => {
  tracer.dogstatsd.distribution('formsg.pdf.generation.latency', latencyMs, {
    isLocal: isLocal.toString()
  })
}
