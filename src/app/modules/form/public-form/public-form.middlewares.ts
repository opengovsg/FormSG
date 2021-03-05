import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'

import { WithForm } from '../../../../types'
import { FormDeletedError } from '../form.errors'
import {
  checkFormSubmissionLimitAndDeactivateForm,
  isFormPublic,
} from '../form.service'

/**
 * Express middleware function that checks if a form has exceeded its submission limits before allowing
 * downstream middleware to handle the request. Otherwise, it returns a HTTP 404.
 */
export const checkFormSubmissionLimitAndDeactivate: RequestHandler = async (
  req,
  res,
  next,
) => {
  const { form } = req as WithForm<typeof req>
  const formResult = await checkFormSubmissionLimitAndDeactivateForm(form)
  if (formResult.isErr()) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: form.inactiveMessage,
      isPageFound: true, // Flag to prevent default 404 subtext ("please check link") from showing
      formTitle: form.title,
    })
  }

  return next()
}

/**
 * Express middleware function that checks if a form attached to the Express request handler is public.
 * before allowing downstream middleware to handle the request. Otherwise, it returns a HTTP 404 if the
 * form is private, or HTTP 410 if the form has been archived.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next middleware function
 */
export const isFormPublicCheck: RequestHandler = (req, res, next) => {
  const { form } = req as WithForm<typeof req>
  return isFormPublic(form)
    .map(() => next())
    .mapErr((error) => {
      return error instanceof FormDeletedError
        ? res.sendStatus(StatusCodes.GONE)
        : res.status(StatusCodes.NOT_FOUND).json({
            message: form.inactiveMessage,
            isPageFound: true, // Flag to prevent default 404 subtext ("please check link") from showing
            formTitle: form.title,
          })
    })
}
