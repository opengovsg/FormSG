import { MapRouteError, MapRouteErrors } from '../../types'
import {
  ApplicationError,
  EmptyErrorFieldError,
} from '../modules/core/core.errors'

/**
 * Used when a route-error mapper expects certain errors to be presented
 * as lists. It takes the first element of an error list to pass into the
 * mapper, with checks on the length for anomalies.
 * @param mapRouteError The error mapper.
 */
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
