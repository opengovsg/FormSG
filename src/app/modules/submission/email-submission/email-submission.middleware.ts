import { celebrate, Joi } from 'celebrate'

import { sharedSubmissionParams } from '../submission.constants'

/**
 * Celebrate validation for the email submissions endpoint.
 */
export const validateResponseParams = celebrate({
  body: Joi.object(sharedSubmissionParams),
})
