import { RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import _ from 'lodash'
import querystring from 'querystring'

import { createLoggerWithLabel } from '../../../../config/logger'
import { AuthType } from '../../../../types'
import { createReqMeta } from '../../../utils/request'
import { getFormIfPublic } from '../../auth/auth.service'
import {
  MYINFO_COOKIE_NAME,
  MYINFO_COOKIE_OPTIONS,
} from '../../myinfo/myinfo.constants'
import { MyInfoCookieStateError } from '../../myinfo/myinfo.errors'
import { MyInfoFactory } from '../../myinfo/myinfo.factory'
import {
  extractMyInfoCookie,
  extractSuccessfulCookie,
  validateMyInfoForm,
} from '../../myinfo/myinfo.util'
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
  const publicFormView = form.getPublicView()
  const { authType } = form

  // Shows the client a form based on how they are authorized
  // If the client is MyInfo, we have to prefill the form
  switch (authType) {
    case AuthType.SP:
    case AuthType.CP: {
      // Form is valid, check for SPCP/MyInfo data.
      return SpcpFactory.getSpcpSession(authType, req.cookies)
        .map(({ userName }) =>
          res.json({
            form: publicFormView,
            spcpSession: { userName },
          }),
        )
        .mapErr((error) => {
          logger.error({
            message: 'Error getting public form',
            meta: {
              action: 'handleGetPublicForm',
              ...createReqMeta(req),
              formId,
            },
            error,
          })
          return res.json({
            form: publicFormView,
          })
        })
    }

    case AuthType.MyInfo: {
      // TODO: shift this out so that the call is FormService.getUniqueMyInfoAttrs(form)
      const requestedAttributes = form.getUniqueMyInfoAttrs()

      // 1. Validate the cookie and myInfo form
      // 2. Fetch myInfo data and fill the form based on the result
      // 3. Hash and save to database
      // 4. Return result if successful otherwise, clear cookies and return default response
      // eslint-disable-next-line typesafe/no-await-without-trycatch
      return extractMyInfoCookie(req.cookies)
        .andThen((cookiePayload) =>
          // Transform into an error because no meaningful work can be done on a errored cookie
          extractSuccessfulCookie(cookiePayload).mapErr(
            () => new MyInfoCookieStateError(),
          ),
        )
        .asyncAndThen((cookiePayload) =>
          validateMyInfoForm(form).asyncAndThen((form) =>
            MyInfoFactory.fetchMyInfoPersonData(
              cookiePayload.accessToken,
              requestedAttributes,
              form.esrvcId,
            ),
          ),
        )
        .andThen((myInfoData) =>
          MyInfoFactory.prefillMyInfoFields(
            myInfoData,
            form.toJSON().form_fields,
          ).map((formFields) => ({
            formFields,
            spcpSession: { userName: myInfoData.getUinFin() },
          })),
        )
        .andThen((form) =>
          // eslint-disable-next-line typesafe/no-await-without-trycatch
          MyInfoFactory.saveMyInfoHashes(
            form.spcpSession.userName,
            formId,
            form.formFields,
          ).map(() => form),
        )
        .map(({ spcpSession, formFields }) =>
          res.json({
            form: _.set(form, 'form_fields', formFields),
            spcpSession,
          }),
        )
        .mapErr((error) => {
          logger.error({
            message: error.message,
            meta: {
              action: 'handlePublicForm',
              ...createReqMeta(req),
              formId: formId,
              esrvcId: form.esrvcId,
              requestedAttributes,
            },
            error,
          })
          return res
            .clearCookie(MYINFO_COOKIE_NAME, MYINFO_COOKIE_OPTIONS)
            .json({
              form: publicFormView,
              myInfoError: true,
            })
        })
    }
    default:
      return res.json({
        form: publicFormView,
      })
  }
}
