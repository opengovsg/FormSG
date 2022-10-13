import { StatusCodes } from 'http-status-codes'

import { BasicField, FormFieldDto } from '~shared/types'

import { HttpError } from '~services/ApiService'

export const getMutationToastDescriptionFieldName = (field: FormFieldDto) => {
  switch (field.fieldType) {
    case BasicField.Section:
      return 'header'
    case BasicField.Image:
      return 'image'
    case BasicField.Statement:
      return 'paragraph'
    default:
      return `field "${field.title}"`
  }
}

export const getMutationErrorMessage = (error: Error): string => {
  if (error instanceof HttpError) {
    switch (error.code) {
      case StatusCodes.FORBIDDEN:
        return 'You do not have permission to modify this form.'
      default:
        break
    }
  }
  return error.message
}
