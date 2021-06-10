import { MapRouteError, MapRouteErrors } from '../../types'
import { ApplicationError } from '../modules/core/core.errors'
import { EmptyErrorFieldError } from '../modules/submission/submission.errors'

export const genericMapRouteErrorTransform = (
  mapRouteError: MapRouteError,
): MapRouteErrors => {
  return (error, coreErrorMessage) => {
    let errorToMap: ApplicationError
    if (Array.isArray(error)) {
      errorToMap = error.length > 0 ? error[0] : new EmptyErrorFieldError()
    } else {
      errorToMap = error
    }
    return mapRouteError(errorToMap, coreErrorMessage)
  }
}
