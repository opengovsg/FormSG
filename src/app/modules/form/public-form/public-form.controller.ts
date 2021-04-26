import { celebrate, Joi, Segments } from 'celebrate'
import { RequestHandler } from 'express'
import { Query } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'
import { err } from 'neverthrow'
import querystring from 'querystring'
import { UnreachableCaseError } from 'ts-essentials'

import { AuthType } from '../../../../types'
import {
  ErrorDto,
  PrivateFormErrorDto,
  PublicFormAuthRedirectDto,
  PublicFormAuthValidateEsrvcIdDto,
} from '../../../../types/api'
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
import {
  extractAndAssertMyInfoCookieValidity,
  validateMyInfoForm,
} from '../../myinfo/myinfo.util'
import { InvalidJwtError, VerifyJwtError } from '../../spcp/spcp.errors'
import { SpcpFactory } from '../../spcp/spcp.factory'
import { getRedirectTarget, validateSpcpForm } from '../../spcp/spcp.util'
import { AuthTypeMismatchError, PrivateFormError } from '../form.errors'
import * as FormService from '../form.service'

import * as PublicFormService from './public-form.service'
import { PublicFormViewDto, RedirectParams } from './public-form.types'
import {
  mapFormAuthRedirectError,
  mapRouteError,
  mapValidateEsrvcIdError,
} from './public-form.utils'

const logger = createLoggerWithLabel(module)

const validateSubmitFormFeedbackParams = celebrate({
  [Segments.BODY]: Joi.object()
    .keys({
      rating: Joi.number().min(1).max(5).cast('string').required(),
      comment: Joi.string().allow('').required(),
    })
    // Allow other keys for backwards compability as frontend might put
    // extra keys in the body.
    .unknown(true),
})

/**
 * NOTE: This is exported solely for unit testing
 * Handler for POST /:formId/feedback endpoint
 * @precondition formId should be present in req.params.
 * @precondition Joi validation should enforce shape of req.body before this handler is invoked.
 *
 * @returns 200 if feedback was successfully saved
 * @returns 404 if form with formId does not exist or is private
 * @returns 410 if form has been archived
 * @returns 500 if database error occurs
 */
export const submitFormFeedback: RequestHandler<
  { formId: string },
  ErrorDto | PrivateFormErrorDto,
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

export const handleSubmitFeedback = [
  validateSubmitFormFeedbackParams,
  submitFormFeedback,
] as RequestHandler[]

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

/**
 * NOTE: This is exported only for testing
 * Generates redirect URL to Official SingPass/CorpPass log in page
 * @param isPersistentLogin whether the client wants to have their login information stored
 * @returns 200 with the redirect url when the user authenticates successfully
 * @returns 400 when there is an error on the authType of the form
 * @returns 400 when the eServiceId of the form does not exist
 * @returns 404 when form with given ID does not exist
 * @returns 500 when database error occurs
 * @returns 500 when the redirect url could not be created
 * @returns 500 when the redirect feature is not enabled
 */
export const _handleFormAuthRedirect: RequestHandler<
  { formId: string },
  PublicFormAuthRedirectDto | ErrorDto,
  unknown,
  Query & { isPersistentLogin?: boolean }
> = (req, res) => {
  const { formId } = req.params
  const { isPersistentLogin } = req.query
  const logMeta = {
    action: 'handleFormAuthRedirect',
    ...createReqMeta(req),
    formId,
  }
  // NOTE: Using retrieveFullForm instead of retrieveForm to ensure authType always exists
  return FormService.retrieveFullFormById(formId)
    .andThen((form) => {
      switch (form.authType) {
        case AuthType.MyInfo:
          return validateMyInfoForm(form).andThen((form) =>
            MyInfoFactory.createRedirectURL({
              formEsrvcId: form.esrvcId,
              formId,
              requestedAttributes: form.getUniqueMyInfoAttrs(),
            }),
          )
        case AuthType.SP:
        case AuthType.CP: {
          // NOTE: Persistent login is only set (and relevant) when the authType is SP.
          // If authType is not SP, assume that it was set erroneously and default it to false
          return validateSpcpForm(form).andThen((form) => {
            const target = getRedirectTarget(
              formId,
              form.authType,
              isPersistentLogin,
            )
            return SpcpFactory.createRedirectUrl(
              form.authType,
              target,
              form.esrvcId,
            )
          })
        }
        // NOTE: Only MyInfo and SPCP should have redirects as the point of a redirect is
        // to provide auth for users from a third party
        default:
          return err<never, AuthTypeMismatchError>(
            new AuthTypeMismatchError(form.authType),
          )
      }
    })
    .map((redirectURL) => {
      return res.status(StatusCodes.OK).json({ redirectURL })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while creating redirect URL',
        meta: logMeta,
        error,
      })
      const { statusCode, errorMessage } = mapFormAuthRedirectError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}

/**
 * Handler for /forms/:formId/auth/redirect
 */
export const handleFormAuthRedirect = [
  celebrate({
    [Segments.PARAMS]: Joi.object({
      formId: Joi.string().pattern(/^[a-fA-F0-9]{24}$/),
    }),
    [Segments.QUERY]: Joi.object({
      isPersistentLogin: Joi.boolean().optional(),
    }),
  }),
  _handleFormAuthRedirect,
] as RequestHandler[]

/**
 * Handler for validating the eServiceId of a given form
 *
 * @returns 200 with eserviceId validation result
 * @returns 400 when there is an error on the authType of the form
 * @returns 400 when the eServiceId of the form does not exist
 * @returns 404 when form with given ID does not exist
 * @returns 500 when the title of the fetched login page does not exist
 * @returns 500 when database error occurs
 * @returns 500 when the url for the login page of the form could not be generated
 * @returns 502 when the login page for singpass could not be fetched
 */
export const handleValidateFormEsrvcId: RequestHandler<
  { formId: string },
  PublicFormAuthValidateEsrvcIdDto | ErrorDto
> = (req, res) => {
  const { formId } = req.params
  return FormService.retrieveFormById(formId)
    .andThen((form) => {
      // NOTE: Because the check is based on parsing the html of the returned webpage,
      // And because MyInfo login is beyond our control, we coerce MyInfo to SP.
      // This is valid because a valid MyInfo eserviceId is also a valid SP eserviceId
      if (form.authType === AuthType.MyInfo) {
        return validateMyInfoForm(form).andThen((form) =>
          SpcpFactory.createRedirectUrl(AuthType.SP, formId, form.esrvcId),
        )
      }
      return validateSpcpForm(form).andThen((form) =>
        SpcpFactory.createRedirectUrl(form.authType, formId, form.esrvcId),
      )
    })
    .andThen(SpcpFactory.fetchLoginPage)
    .andThen(SpcpFactory.validateLoginPage)
    .map((result) => res.status(StatusCodes.OK).json(result))
    .mapErr((error) => {
      logger.error({
        message: 'Error while validating e-service ID',
        meta: {
          action: 'handleValidateFormEsrvcId',
          ...createReqMeta(req),
          formId,
        },
        error,
      })
      const { statusCode, errorMessage } = mapValidateEsrvcIdError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}
