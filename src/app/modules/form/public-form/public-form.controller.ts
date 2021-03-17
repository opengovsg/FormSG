import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import { err, errAsync, ok, okAsync, Result } from 'neverthrow'
import querystring from 'querystring'

import { createLoggerWithLabel } from '../../../../config/logger'
import { AuthType } from '../../../../types'
import { createReqMeta } from '../../../utils/request'
import { MyInfoFactory } from '../../myinfo/myinfo.factory'
import {
  MyInfoCookiePayload,
  MyInfoCookieState,
} from '../../myinfo/myinfo.types'
import {
  extractMyInfoCookie,
  validateMyInfoForm,
} from '../../myinfo/myinfo.util'
import { AuthTypeMismatchError } from '../../spcp/spcp.errors'
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

const extractCookieInfo = (
  cookiePayload: MyInfoCookiePayload,
  authType: AuthType,
): Result<MyInfoCookiePayload, AuthTypeMismatchError> =>
  authType === AuthType.MyInfo
    ? ok(cookiePayload)
    : err(new AuthTypeMismatchError(AuthType.MyInfo))

export const handleGetPublicForm: RequestHandler<{ formId: string }> = async (
  req,
  res,
) => {
  const { formId } = req.params
  // eslint-disable-next-line typesafe/no-await-without-trycatch
  const formData = await FormService.retrievePublicFormById(formId)
    .andThen((form) =>
      FormService.checkFormSubmissionLimitAndDeactivateForm(form),
    )
    .andThen((form) => {
      const { authType } = form
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const jwtPayload = SpcpFactory.getSpcpSession(
        authType,
        req.cookies,
      ).mapErr((error) => {
        logger.error({
          message: 'Failed to verify JWT with auth client',
          meta: {
            action: 'addSpcpSessionInfo',
            ...createReqMeta(req),
          },
          error,
        })
        return error
      })

      const myInfoCookie: Result<
        MyInfoCookiePayload,
        AuthTypeMismatchError
      > = extractMyInfoCookie(req.cookies).andThen((cookiePayload) =>
        extractCookieInfo(cookiePayload, authType),
      )

      const myInfoError = myInfoCookie
        .andThen(({ state }) => ok(state !== MyInfoCookieState.Success))
        .unwrapOr(true)

      const requestedAttributes = form.getUniqueMyInfoAttrs()
      const spcpSession = myInfoCookie.asyncAndThen((cookiePayload) => {
        return validateMyInfoForm(form).asyncAndThen((form) =>
          cookiePayload.state === MyInfoCookieState.Success
            ? MyInfoFactory.fetchMyInfoPersonData(
                cookiePayload.accessToken,
                requestedAttributes,
                form.esrvcId,
              ).andThen((myinfoData) =>
                okAsync({ userName: myinfoData.getUinFin() }),
              )
            : errAsync('cookie payload has wrong state'),
        )
      })

      return {
        form: form.getPublicView(),
        spcpSession,
        myInfoError,
      }

      //   .map() => return form and spcpSession
      //   .mapErr() => return form and myInfoError
    })

  return res.json(formData)
}

// SpcpController.addSpcpSessionInfo,
// MyInfoMiddleware.addMyInfo,
// forms.read(forms.REQUEST_TYPE.PUBLIC),
