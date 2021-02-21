import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'

import { createLoggerWithLabel } from '../../../../config/logger'
import { WithForm } from '../../../../types'
import getSubmissionModel from '../../../models/submission.server.model'
import { FormDeletedError } from '../form.errors'
import { deactivateForm, isFormPublic } from '../form.service'

const SubmissionModel = getSubmissionModel(mongoose)

const logger = createLoggerWithLabel(module)

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
  if (form.hasSubmissionLimit) {
    const currentCount = await SubmissionModel.countDocuments({
      form: form._id,
    }).exec()
    if (currentCount >= form.submissionLimit) {
      logger.warn({
        message:
          'Form submission reached maximum submission count, deactivating form.',
        meta: {
          form: form._id,
          action: 'checkFormSubmissionLimitAndDeactivate',
        },
      })
      await deactivateForm(form._id)
      return res.status(StatusCodes.NOT_FOUND).json({
        message: form.inactiveMessage,
        isPageFound: true, // Flag to prevent default 404 subtext ("please check link") from showing
        formTitle: form.title,
      })
    } else {
      return next()
    }
  } else {
    return next()
  }
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
