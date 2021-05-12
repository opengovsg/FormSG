import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ResultAsync } from 'neverthrow'

import { IPopulatedForm } from '../../../../../types'
import { createLoggerWithLabel } from '../../../../config/logger'
import { createReqMeta } from '../../../../utils/request'
import * as AuthService from '../../../auth/auth.service'
import {
  DatabaseConflictError,
  DatabaseError,
  DatabasePayloadSizeError,
  DatabaseValidationError,
} from '../../../core/core.errors'
import { mapRouteError } from '../../../submission/encrypt-submission/encrypt-submission.utils'
import * as UserService from '../../../user/user.service'
import { getFormFieldById } from '../../form.utils'
import { FormUpdateParams, PermissionLevel } from '../admin-form.types'

import { EditFieldError } from './fields.errors'
import * as FieldService from './fields.service'

const logger = createLoggerWithLabel(module)

/**
 * Handler for POST /:formId/fields/:fieldId/duplicate
 * @security session
 *
 * @returns 200 with updated form
 * @returns 400 when form field has invalid updates to be performed
 * @returns 403 when current user does not have permissions to update form
 * @returns 404 when form or field to update cannot be found
 * @returns 409 when saving updated form incurs a conflict in the database
 * @returns 410 when form to update is archived
 * @returns 413 when updated form is too large to be saved in the database
 * @returns 422 when user in session cannot be retrieved from the database
 * @returns 500 when database error occurs
 */
export const handleDuplicateField: RequestHandler<
  { formId: string; fieldId: string },
  unknown,
  { form: FormUpdateParams }
> = (req, res) => {
  const { formId, fieldId } = req.params
  const { form: formUpdateParams } = req.body
  const sessionUserId = (req.session as Express.AuthedSession).user._id

  // Step 1: Retrieve currently logged in user.
  return UserService.getPopulatedUserById(sessionUserId)
    .andThen((user) =>
      // Step 2: Retrieve form with write permission check.
      AuthService.getFormAfterPermissionChecks({
        user,
        formId,
        level: PermissionLevel.Write,
      }),
    )
    .andThen((retrievedForm) => {
      // Step 3: Update form or form fields depending on form update parameters
      // passed in.
      const formField = getFormFieldById(retrievedForm.form_fields, fieldId)
      // Use different service function depending on type of form update.
      const updateFormResult: ResultAsync<
        IPopulatedForm,
        | EditFieldError
        | DatabaseError
        | DatabaseValidationError
        | DatabaseConflictError
        | DatabasePayloadSizeError
      > = FieldService.duplicateFormFields(retrievedForm, formField)

      return updateFormResult
    })
    .map((updatedForm) => res.status(StatusCodes.OK).json(updatedForm))
    .mapErr((error) => {
      logger.error({
        message: 'Error occurred when updating form',
        meta: {
          action: 'handleUpdateForm',
          ...createReqMeta(req),
          userId: sessionUserId,
          formId,
          formUpdateParams,
        },
        error,
      })
      const { errorMessage, statusCode } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}
