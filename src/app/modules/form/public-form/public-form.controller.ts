import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import querystring from 'querystring'
import { UnreachableCaseError } from 'ts-essentials'

import { createLoggerWithLabel } from '../../../../config/logger'
import { AuthType } from '../../../../types'
import { isMongoError } from '../../../utils/handle-mongo-error'
import { createReqMeta, getRequestIp } from '../../../utils/request'
import { getFormIfPublic } from '../../auth/auth.service'
import {
  MyInfoCookieAccessError,
  MyInfoMissingAccessTokenError,
} from '../../myinfo/myinfo.errors'
import { MyInfoFactory } from '../../myinfo/myinfo.factory'
import { extractAndAssertMyInfoCookieValidity } from '../../myinfo/myinfo.util'
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

  const formResult = await getFormIfPublic(formId)
    .andThen((form) =>
      FormService.checkFormSubmissionLimitAndDeactivateForm(form),
    )
    .andThen((form) =>
      FormService.setIsIntranetFormAccess(getRequestIp(req), form),
    )

  // Early return if form is not public or any error occurred.
  if (formResult.isErr()) {
    const { error } = formResult
    // NOTE: Only log on possible database errors.
    // This is because the other kinds of errors are expected errors and are not truly exceptional
    if (isMongoError(error)) {
      logger.error({
        message: 'Error retrieving public form',
        meta: {
          action: 'handleGetPublicForm',
          ...createReqMeta(req),
          formId,
        },
        error,
      })
    }
    const { errorMessage, statusCode } = mapRouteError(error)
    return res.status(statusCode).json({ message: errorMessage })
  }

  const intranetForm = formResult.value
  const { form, isIntranetUser } = intranetForm
  const publicForm = intranetForm.form.getPublicView()
  const { authType } = intranetForm.form

  // Step 1: Call the appropriate handler

  switch (authType) {
    // Do not need to do any extra chaining of services.
    case AuthType.NIL:
      return res.json({ form: publicForm })
    case AuthType.SP:
    case AuthType.CP:
      return SpcpFactory.getSpcpSession(authType, req.cookies)
        .map((spcpSession) =>
          res.json({
            ...intranetForm,
            spcpSession,
          }),
        )
        .mapErr((error) => {
          // Step 3: Report relevant errors - verification failed for user
          if (
            error instanceof VerifyJwtError ||
            error instanceof InvalidJwtError
          ) {
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
          return (res.json(intranetForm))
        })
    case AuthType.MyInfo: {
      return MyInfoFactory.fetchMyInfoData(form, req.cookies)
        .andThen((myInfoData) => {
            // MyInfoFactory.createFormMyInfoMeta
              return MyInfoFactory.createFormWithMyInfo(
                form.toJSON().form_fields,
                myInfoData,
                form._id,
              )}
        )
        .andThen(({ prefilledFields, spcpSession }) => {
          return extractAndAssertMyInfoCookieValidity(req.cookies).map(
            (myInfoCookie) => ({
             prefilledFields,
             spcpSession,
             myInfoCookie,
            }),
          )
        })
        .map(({myInfoCookie, prefilledFields, spcpSession}) => {
            return res.cookie(.....).json({
                spcpSession,
                form: { ...publicForm, formFields...{ }
            })
        })
        .mapErr((error) => {
            // ADD COMMENT WHY
            const isMyInfoError = !(error instanceof MyInfoCookieAccessError || error instanceof MyInfoMissingAccessTokenError)
          // clear cookie
          return res.clearCookie().json({
              form: publicForm,
              myInfoError: isMyInfoError || undefined
            }),
          )
        })
    default:
      return new UnreachableCaseError(authType)
  }
}
  }
