import { Router } from 'express'

import * as AdminFormController from '../../../../../modules/form/admin-form/admin-form.controller'

export const AdminFormsGoGovRouter = Router()

AdminFormsGoGovRouter.route('/:formId([a-fA-F0-9]{24})/gogov')
  /**
   * Get the specified form's go.gov.sg link suffix
   * @route GET /:formId/gogov
   * @security session
   */
  .get(AdminFormController.handleGetGoLinkSuffix)

  /**
   * Set the go.gov.sg link for specified form
   * @route POST /:formId/gogov
   * @security session
   */
  .post(AdminFormController.handleSetGoLinkSuffix)
