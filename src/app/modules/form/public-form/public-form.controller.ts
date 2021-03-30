import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import { okAsync } from 'neverthrow'
import querystring from 'querystring'

import { createLoggerWithLabel } from '../../../../config/logger'
import { AuthType, FormController } from '../../../../types'
import { createReqMeta } from '../../../utils/request'
import { getFormIfPublic } from '../../auth/auth.service'
import {
  MYINFO_COOKIE_NAME,
  MYINFO_COOKIE_OPTIONS,
} from '../../myinfo/myinfo.constants'
import { MyInfoFactory } from '../../myinfo/myinfo.factory'
import { MyInfoCookiePayload } from '../../myinfo/myinfo.types'
import { extractSuccessfulMyInfoCookie } from '../../myinfo/myinfo.util'
import { InvalidJwtError, VerifyJwtError } from '../../spcp/spcp.errors'
import { SpcpFactory } from '../../spcp/spcp.factory'
import { PrivateFormError } from '../form.errors'
import * as FormService from '../form.service'

import * as PublicFormService from './public-form.service'
import { RedirectParams } from './public-form.types'
import { mapRouteError } from './public-form.utils'

const logger = createLoggerWithLabel(module)

/**
 * Handler for POST /:formId/feedback endpoint
 * @precondition formId should be present in req.params.
 * @precondition Joi validation should enforce shape of req.body before this handler is invoked.
 *
 * @returns 200 if feedback was successfully saved
 * @returns 404 if form with formId does not exist or is private
 * @returns 410 if form has been archived
 * @returns 500 if database error occurs
 */
export const handleSubmitFeedback: RequestHandler<
  { formId: string },
  unknown,
  { rating: number; comment: string }
> = async (req, res) => {
  const { formId } = req.params
  const { rating, comment } = req.body

  const formResult = await FormService.retrieveFullFormById(formId)

  if (formResult.isErr()) {
    const { error } = formResult
    logger.error({
      message: 'Failed to retrieve form',
      meta: {
        action: 'handleSubmitFeedback',
        ...createReqMeta(req),
        formId,
      },
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  const form = formResult.value

  // Handle form status states.
  const isPublicResult = FormService.isFormPublic(form)
  if (isPublicResult.isErr()) {
    const { error } = isPublicResult
    logger.warn({
      message: 'Form is not public',
      meta: {
        action: 'handleSubmitFeedback',
        ...createReqMeta(req),
        formId,
      },
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)

    // Specialized error response for PrivateFormError.
    if (error instanceof PrivateFormError) {
      return res.status(statusCode).json({
        message: error.message,
        // Flag to prevent default 404 subtext ("please check link") from
        // showing.
        isPageFound: true,
        formTitle: error.formTitle,
      })
    }
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Form is valid, proceed to next step.
  const submitFeedbackResult = await PublicFormService.insertFormFeedback({
    formId: form._id,
    rating,
    comment,
  })

  if (submitFeedbackResult.isErr()) {
    const { error } = submitFeedbackResult
    logger.error({
      message: 'Error creating form feedback',
      meta: {
        action: 'handleSubmitFeedback',
        ...createReqMeta(req),
        formId,
      },
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  // Success.
  return res
    .status(StatusCodes.OK)
    .json({ message: 'Successfully submitted feedback' })
}

/**
 * Handler for various endpoints to redirect to their hashbanged versions.
 * This allows form links to be free of hashbangs and can thus be shared
 * via QR codes or url shorteners. Also handles requests from web crawlers
 * for the generation of rich link previews, renders index with the relevant
 * metatags if a crawler's user agent string is detected.
 * @precondition Id should be present in req.params.
 *
 * @returns 302 redirect
 */
export const handleRedirect: RequestHandler<
  RedirectParams,
  unknown,
  unknown,
  Record<string, string>
> = async (req, res) => {
  const { state, Id } = req.params

  let redirectPath = state ? `${Id}/${state}` : Id
  const queryString = querystring.stringify(req.query)
  if (queryString.length > 0) {
    redirectPath = redirectPath + '?' + encodeURIComponent(queryString)
  }

  const baseUrl = `${req.protocol}://${req.hostname}`
  const appUrl = baseUrl + req.originalUrl

  const createMetatagsResult = await PublicFormService.createMetatags({
    formId: Id,
    appUrl,
    imageBaseUrl: baseUrl,
  })

  // Failed to create metatags.
  if (createMetatagsResult.isErr()) {
    logger.error({
      message: 'Error fetching metatags',
      meta: {
        action: 'handleRedirect',
        ...createReqMeta(req),
      },
      error: createMetatagsResult.error,
    })

    // Fallback to redirect to hashbanged version instead of attaching metatags
    // before redirecting.
    return res.redirect('/#!/' + redirectPath)
  }

  // Metatags creation successful.
  return res.render('index', {
    ...createMetatagsResult.value,
    redirectPath,
  })
}

/**
 * Handler for GET /:formId/publicform endpoint
 * @returns 200 if the form exists
 * @returns 404 if form with formId does not exist or is private
 * @returns 410 if form has been archived
 * @returns 500 if database error occurs or if the type of error is unknown
 */
export const handleGetPublicForm: RequestHandler<{ formId: string }> = async (
  req,
  res,
) => {
  const { formId } = req.params

  const formResult = await getFormIfPublic(formId).andThen((form) =>
    FormService.checkFormSubmissionLimitAndDeactivateForm(form),
  )

  // Early return if form is not public or any error occurred.
  if (formResult.isErr()) {
    const { error } = formResult
    logger.error({
      message: 'Error retrieving public form',
      meta: {
        action: 'handleGetPublicForm',
        ...createReqMeta(req),
        formId,
      },
      error,
    })
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  const form = formResult.value
  const publicForm = form.getPublicView()
  const { authType } = form
  let myInfoError: boolean

  // NOTE: Creating a variable to ensure that TS will enforce the type and ensure all keys in AuthType are covered.
  const formController: FormController<
    | ReturnType<typeof SpcpFactory.createFormWithSpcpSession>
    | ReturnType<typeof MyInfoFactory.createFormWithMyInfo>
  > = {
    [AuthType.SP]: () =>
      SpcpFactory.createFormWithSpcpSession(form, req.cookies),
    [AuthType.CP]: () =>
      SpcpFactory.createFormWithSpcpSession(form, req.cookies),
    [AuthType.MyInfo]: () => {
      return MyInfoFactory.createFormWithMyInfo(form, req.cookies)
        .andThen((publicForm) => {
          return extractSuccessfulMyInfoCookie(req.cookies).map(
            (myInfoCookie) => {
              const cookiePayload: MyInfoCookiePayload = {
                ...myInfoCookie,
                usedCount: myInfoCookie.usedCount + 1,
              }
              // NOTE: This is a side effect to set the cookie on the result after it has been successfully prefilled.
              res.cookie(
                MYINFO_COOKIE_NAME,
                cookiePayload,
                MYINFO_COOKIE_OPTIONS,
              )
              return publicForm
            },
          )
        })
        .mapErr((error) => {
          // NOTE: This is a side-effect as there is no need for cookie if data could not be retrieved
          res.clearCookie(MYINFO_COOKIE_NAME, MYINFO_COOKIE_OPTIONS)
          // NOTE: This is done as a workaround because the type of FormController enforces a uniform return value
          // but we are required to signal if myInfoError in the event of an error
          myInfoError = true
          return error
        })
    },
    [AuthType.NIL]: () => okAsync({ form: form.getPublicView() }),
  }

  // NOTE: Once there is a valid form retrieved from the database,
  // the client should always get a 200 response with the form's public view.
  // Additional errors should be tagged onto the response object like myInfoError.
  return formController[authType]()
    .map((publicFormView) => res.json(publicFormView))
    .mapErr((error) => {
      if (error instanceof VerifyJwtError || error instanceof InvalidJwtError) {
        logger.error({
          message: 'Error getting public form',
          meta: {
            action: 'handleGetPublicForm',
            ...createReqMeta(req),
            formId,
          },
          error,
        })
      }
      return res.json({
        form: publicForm,
        ...(myInfoError && { myInfoError }),
      })
    })
}
