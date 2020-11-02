import mongoose from 'mongoose'
import { ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../../config/logger'
import { DashboardFormView } from '../../../../types'
import getFormModel from '../../../models/form.server.model'
import { DatabaseError } from '../../core/core.errors'
import { MissingUserError } from '../../user/user.errors'
import { findAdminById } from '../../user/user.service'

const logger = createLoggerWithLabel(module)
const FormModel = getFormModel(mongoose)

/**
 * Retrieves a list of forms that the user of the given userId can access in
 * their dashboard.
 * @param userId the id of the user to retrieve accessible forms for.
 * @returns ok(DashboardFormViewList)
 * @returns err(MissingUserError) if user with userId does not exist in the database
 * @returns err(DatabaseError) if error occurs whilst querying the database
 */
export const getDashboardForms = (
  userId: string,
): ResultAsync<DashboardFormView[], MissingUserError | DatabaseError> => {
  // Step 1: Verify user exists.
  return (
    findAdminById(userId)
      // Step 2: Retrieve lists users are authorized to see.
      .andThen((admin) => {
        return ResultAsync.fromPromise(
          FormModel.getDashboardForms(userId, admin.email),
          (error) => {
            logger.error({
              message: 'Database error when retrieving admin dashboard forms',
              meta: {
                action: 'getDashboardForms',
                userId,
              },
              error,
            })

            return new DatabaseError()
          },
        )
      })
  )
}
