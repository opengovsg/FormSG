import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import querystring from 'querystring'
import { UnreachableCaseError } from 'ts-essentials'

import { AuthType } from '../../../../types'
import { ErrorDto, PrivateFormErrorDto } from '../../../../types/api'
import { createLoggerWithLabel } from '../../../config/logger'
import { isMongoError } from '../../../utils/handle-mongo-error'
import { createReqMeta, getRequestIp } from '../../../utils/request'
import { getFormIfPublic } from '../../auth/auth.service'
import {
  MYINFO_COOKIE_NAME,
  MYINFO_COOKIE_OPTIONS,
} from '../../myinfo/myinfo.constants'
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
import { PublicFormViewDto, RedirectParams } from './public-form.types'
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
export const handleGetPublicForm: RequestHandler<
  { formId: string },
  PublicFormViewDto | ErrorDto | PrivateFormErrorDto
> = async (req, res) => {
  const { formId } = req.params
  const logMeta = {
    action: 'handleGetPublicForm',
    ...createReqMeta(req),
    formId,
  }

  const formResult = await getFormIfPublic(formId).andThen((form) =>
    FormService.checkFormSubmissionLimitAndDeactivateForm(form),
  )

  // Early return if form is not public or any error occurred.
  if (formResult.isErr()) {
    const { error } = formResult
    // NOTE: Only log on possible database errors.
    // This is because the other kinds of errors are expected errors and are not truly exceptional
    if (isMongoError(error)) {
      logger.error({
        message: 'Error retrieving public form',
        meta: logMeta,
        error,
      })
    }
    const { errorMessage, statusCode } = mapRouteError(error)

    // Specialized error response for PrivateFormError.
    // This is to maintain backwards compatibility with the middleware implementation
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

  const form = formResult.value
  const publicForm = form.getPublicView()
  const { authType } = form
  const isIntranetUser = FormService.checkIsIntranetFormAccess(
    getRequestIp(req),
    form,
  )

  switch (authType) {
    case AuthType.NIL:
      return res.json({ form: publicForm, isIntranetUser })
    case AuthType.SP:
    case AuthType.CP:
      return SpcpFactory.extractJwtPayloadFromRequest(authType, req.cookies)
        .map(({ userName }) =>
          res.json({
            form: publicForm,
            isIntranetUser,
            spcpSession: { userName },
          }),
        )
        .mapErr((error) => {
          // Report only relevant errors - verification failed for user here
          if (
            error instanceof VerifyJwtError ||
            error instanceof InvalidJwtError
          ) {
            logger.error({
              message: 'Error getting public form',
              meta: logMeta,
              error,
            })
          }
          return res.json({ form: publicForm, isIntranetUser })
        })
    case AuthType.MyInfo: {
      // Step 1. Fetch required data and fill the form based off data retrieved
      return (
        MyInfoFactory.getMyInfoDataForForm(form, req.cookies)
          .andThen((myInfoData) => {
            return MyInfoFactory.prefillAndSaveMyInfoFields(
              form._id,
              myInfoData,
              form.toJSON().form_fields,
            ).map((prefilledFields) => ({
              prefilledFields,
              spcpSession: { userName: myInfoData.getUinFin() },
            }))
          })
          // Check if the user is signed in
          .andThen(({ prefilledFields, spcpSession }) => {
            return extractAndAssertMyInfoCookieValidity(req.cookies).map(
              (myInfoCookie) => ({
                prefilledFields,
                spcpSession,
                myInfoCookie,
              }),
            )
          })
          .map(({ myInfoCookie, prefilledFields, spcpSession }) => {
            const updatedMyInfoCookie = {
              ...myInfoCookie,
              usedCount: myInfoCookie.usedCount + 1,
            }
            // Set the updated cookie accordingly and return the form back to the user
            return res
              .cookie(
                MYINFO_COOKIE_NAME,
                updatedMyInfoCookie,
                MYINFO_COOKIE_OPTIONS,
              )
              .json({
                spcpSession,
                form: { ...publicForm, form_fields: prefilledFields },
                isIntranetUser,
              })
          })
          .mapErr((error) => {
            // NOTE: If the user is not signed in or if the user refreshes the page while logged in, it is not an error.
            // myInfoError is set to true only when the authentication provider rejects the user's attempt at auth
            // or when there is a network or database error during the process of retrieval
            const isMyInfoError = !(
              error instanceof MyInfoCookieAccessError ||
              error instanceof MyInfoMissingAccessTokenError
            )
            // No need for cookie if data could not be retrieved
            // NOTE: If the user does not have any cookie, clearing the cookie still has the same result
            return res
              .clearCookie(MYINFO_COOKIE_NAME, MYINFO_COOKIE_OPTIONS)
              .json({
                form: publicForm,
                // Setting to undefined ensures that the frontend does not get myInfoError if it is false
                myInfoError: isMyInfoError || undefined,
                isIntranetUser,
              })
          })
      )
    }
    default:
      return new UnreachableCaseError(authType)
  }
}
