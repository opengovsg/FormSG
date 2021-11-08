import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsTwilioRouter = Router()

AdminFormsTwilioRouter.route('/:formId([a-fA-F0-9]{24})/twilio')
  /**
   * Update the specified form twilio credentials
   * @route PUT /:formId/twilio
   * @security session
   *
   * @returns 200 with updated twilio credentials
   * @returns 500 when database error occurs
   */
  .put(AdminFormController.handleUpdateTwilio)
