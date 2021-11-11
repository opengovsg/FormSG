import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsTwilioRouter = Router()

AdminFormsTwilioRouter.route('/:formId([a-fA-F0-9]{24})/twilio')
  /**
   * Update the specified form twilio credentials
   * @route PUT /:formId/twilio
   * @security session
   *
   * @returns 200 with twilio credentials succesfully updated
   * @returns 400 with twilio credentials are invalid
   * @returns 401 when user is not logged in
   * @returns 403 when user does not have permissions to update the form
   * @returns 404 when form to update cannot be found
   * @returns 422 when id of user who is updating the form cannot be found
   * @returns 500 when database error occurs
   */
  .put(AdminFormController.handleUpdateTwilio)
