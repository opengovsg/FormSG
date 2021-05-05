import { celebrate, Joi, Segments } from 'celebrate'
import { Router } from 'express'

import { withUserAuthentication } from '../auth/auth.middlewares'

import * as ExamplesController from './examples.controller'

export const ExamplesRouter = Router()

// All routes in this router are protected.
ExamplesRouter.use(withUserAuthentication)

/**
 * Lists publicly available forms that can be used as templates.
 * @security session
 * @route GET /examples
 * @param pageNo.query.required the page number of results returned
 * @param agency.query the _id of agency to filter examples by
 * @param searchTerm.query the earch term to match against example forms' title and instructions
 * @param shouldGetTotalNumResults.query whether to return the total number of results in addition to search results
 * @returns 200 with an array of forms to be listed on the examples page
 * @returns 401 when user does not exist in session
 * @returns 500 when error occurs whilst querying the database
 */
ExamplesRouter.get(
  '/',
  celebrate({
    [Segments.QUERY]: Joi.object().keys({
      pageNo: Joi.number().min(0).required(),
      agency: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .allow(''),
      searchTerm: Joi.string().allow(''),
      shouldGetTotalNumResults: Joi.boolean().default(false),
    }),
  }),
  ExamplesController.handleGetExamples,
)

/**
 * Returns example information for the form that is referenced by the given
 * formId.
 * @route GET /examples/:formId
 * @param formId.params.required the _id of the form to return example information for
 * @returns 200 with the example information of the retrieved form
 * @returns 401 when user does not exist in session
 * @returns 404 when the form with given formId does not exist in the database
 * @returns 500 when error occurs whilst querying the database
 */
ExamplesRouter.get(
  '/:formId([a-fA-F0-9]{24})',
  ExamplesController.handleGetExampleByFormId,
)
