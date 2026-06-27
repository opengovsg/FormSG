import { HttpError } from '~services/ApiService'

export enum FormCollaboratorAction {
  UPDATE,
  ADD,
  REMOVE,
  TRANSFER_OWNERSHIP,
  REMOVE_SELF,
}

const getMappedBadRequestErrorMessage = (
  formCollaboratorAction: FormCollaboratorAction,
  originalErrorMessage: string,
): string => {
  let badRequestErrorMessage
  switch (formCollaboratorAction) {
    case FormCollaboratorAction.ADD:
      badRequestErrorMessage = `The collaborator was unable to be added or edited. Please try again or refresh the page.`
      break
    case FormCollaboratorAction.TRANSFER_OWNERSHIP:
      badRequestErrorMessage = originalErrorMessage
      break
    default:
      badRequestErrorMessage = `Sorry, an error occurred. Please refresh the page and try again later.`
  }

  return badRequestErrorMessage
}

const getMappedDefaultErrorMessage = (
  formCollaboratorAction: FormCollaboratorAction,
): string => {
  let defaultErrorMessage
  switch (formCollaboratorAction) {
    case FormCollaboratorAction.ADD:
      defaultErrorMessage = 'Error adding collaborator.'
      break
    case FormCollaboratorAction.UPDATE:
      defaultErrorMessage = 'Error updating collaborator.'
      break
    case FormCollaboratorAction.REMOVE:
      defaultErrorMessage = 'Error removing collaborator.'
      break
    case FormCollaboratorAction.REMOVE_SELF:
      defaultErrorMessage = 'Error removing self.'
      break
    case FormCollaboratorAction.TRANSFER_OWNERSHIP:
      defaultErrorMessage = 'Error transfering form ownership.'
      break
    //should not reach
    default:
      defaultErrorMessage = 'Error.'
  }
  return defaultErrorMessage
}

const getCollaboratorUnprocessableEntityErrorMessage = (
  error: HttpError,
  formCollaboratorAction: FormCollaboratorAction,
): string => {
  return (
    error.message ||
    `${getMappedDefaultErrorMessage(
      formCollaboratorAction,
    )} Please refresh and try again.`
  )
}

export const getMappedCollaboratorErrorMessage = (
  error: Error,
  formCollaboratorAction: FormCollaboratorAction,
): string => {
  // check if error is an instance of HttpError to be able to access status code of error
  if (error instanceof HttpError) {
    let errorMessage
    switch (error.code) {
      case 422:
        errorMessage = getCollaboratorUnprocessableEntityErrorMessage(
          error,
          formCollaboratorAction,
        )
        break
      case 400:
        errorMessage = getMappedBadRequestErrorMessage(
          formCollaboratorAction,
          error.message,
        )
        break
      default:
        errorMessage = getMappedDefaultErrorMessage(formCollaboratorAction)
    }
    return errorMessage
  }
  // if error is not of type HttpError return the error message encapsulated in Error object
  return error.message
}
