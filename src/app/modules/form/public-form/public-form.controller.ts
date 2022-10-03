import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import { err } from 'neverthrow'
import querystring from 'querystring'
import { UnreachableCaseError } from 'ts-essentials'

import {
  ErrorDto,
  FormAuthType,
  FormFieldDto,
  PrivateFormErrorDto,
  PublicFormAuthLogoutDto,
  PublicFormAuthRedirectDto,
  PublicFormAuthValidateEsrvcIdDto,
  PublicFormDto,
  PublicFormViewDto,
} from '../../../../../shared/types'
import { createLoggerWithLabel } from '../../../config/logger'
import { isMongoError } from '../../../utils/handle-mongo-error'
import { createReqMeta, getRequestIp } from '../../../utils/request'
import { getFormIfPublic } from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import {
  MYINFO_COOKIE_NAME,
  MYINFO_COOKIE_OPTIONS,
} from '../../myinfo/myinfo.constants'
import {
  MyInfoCookieAccessError,
  MyInfoMissingAccessTokenError,
} from '../../myinfo/myinfo.errors'
import { MyInfoService } from '../../myinfo/myinfo.service'
import {
  extractAndAssertMyInfoCookieValidity,
  validateMyInfoForm,
} from '../../myinfo/myinfo.util'
import { SgidInvalidJwtError, SgidVerifyJwtError } from '../../sgid/sgid.errors'
import { SgidService } from '../../sgid/sgid.service'
import { validateSgidForm } from '../../sgid/sgid.util'
import { InvalidJwtError, VerifyJwtError } from '../../spcp/spcp.errors'
import { getOidcService } from '../../spcp/spcp.oidc.service'
import { SpcpService } from '../../spcp/spcp.service'
import {
  getRedirectTargetSpcpOidc,
  validateSpcpForm,
} from '../../spcp/spcp.util'
import { AuthTypeMismatchError, PrivateFormError } from '../form.errors'
import * as FormService from '../form.service'

import * as PublicFormService from './public-form.service'
import { RedirectParams } from './public-form.types'
import { mapFormAuthError, mapRouteError } from './public-form.utils'

const logger = createLoggerWithLabel(module)

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
export const handleRedirect: ControllerHandler<
  RedirectParams,
  unknown,
  unknown,
  Record<string, string>
> = async (req, res) => {
  const { state, formId } = req.params

  let redirectPath = state ? `${formId}/${state}` : formId
  const queryString = querystring.stringify(req.query)
  if (queryString.length > 0) {
    redirectPath = redirectPath + '?' + encodeURIComponent(queryString)
  }

  const baseUrl = `${req.protocol}://${req.hostname}`
  const appUrl = baseUrl + req.originalUrl

  const createMetatagsResult = await PublicFormService.createMetatags({
    formId,
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
export const handleGetPublicForm: ControllerHandler<
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
  const publicForm = form.getPublicView() as PublicFormDto
  const { authType } = form
  const isIntranetUser = FormService.checkIsIntranetFormAccess(
    getRequestIp(req),
    form,
  )

  switch (authType) {
    case FormAuthType.NIL:
      return res.json({ form: publicForm, isIntranetUser })
    case FormAuthType.SP:
      return getOidcService(FormAuthType.SP)
        .extractJwtPayloadFromRequest(req.cookies)
        .map((spcpSession) => {
          return res.json({
            form: publicForm,
            isIntranetUser,
            spcpSession,
          })
        })
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
    case FormAuthType.CP:
      return getOidcService(FormAuthType.CP)
        .extractJwtPayloadFromRequest(req.cookies)
        .map((spcpSession) => {
          return res.json({
            form: publicForm,
            isIntranetUser,
            spcpSession,
          })
        })
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
    case FormAuthType.MyInfo: {
      // Step 1. Fetch required data and fill the form based off data retrieved
      return (
        MyInfoService.getMyInfoDataForForm(form, req.cookies)
          .andThen((myInfoData) => {
            return MyInfoService.prefillAndSaveMyInfoFields(
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
                form: {
                  ...publicForm,
                  form_fields: prefilledFields as FormFieldDto[],
                },
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
    case FormAuthType.SGID:
      return SgidService.extractSgidJwtPayload(req.cookies.jwtSgid)
        .map((spcpSession) => {
          return res.json({
            form: publicForm,
            isIntranetUser,
            spcpSession,
          })
        })
        .mapErr((error) => {
          // Report only relevant errors - verification failed for user here
          if (
            error instanceof SgidVerifyJwtError ||
            error instanceof SgidInvalidJwtError
          ) {
            logger.error({
              message: 'Error getting public form',
              meta: logMeta,
              error,
            })
          }
          return res.json({ form: publicForm, isIntranetUser })
        })
    default:
      return new UnreachableCaseError(authType)
  }
}

/**
 * NOTE: This is exported only for testing
 * Generates redirect URL to Official SingPass/CorpPass log in page
 * @param isPersistentLogin whether the client wants to have their login information stored
 * @param encodedQuery base64 encoded queryId for frontend to retrieve stored query params (usually contains prefilled form information)
 * @returns 200 with the redirect url when the user authenticates successfully
 * @returns 400 when there is an error on the authType of the form
 * @returns 400 when the eServiceId of the form does not exist
 * @returns 404 when form with given ID does not exist
 * @returns 500 when database error occurs
 * @returns 500 when the redirect url could not be created
 * @returns 500 when the redirect feature is not enabled
 */
export const _handleFormAuthRedirect: ControllerHandler<
  { formId: string },
  PublicFormAuthRedirectDto | ErrorDto,
  unknown,
  { isPersistentLogin?: boolean; encodedQuery?: string }
> = (req, res) => {
  const { formId } = req.params
  const { isPersistentLogin, encodedQuery } = req.query
  const logMeta = {
    action: 'handleFormAuthRedirect',
    ...createReqMeta(req),
    formId,
  }
  // NOTE: Using retrieveFullForm instead of retrieveForm to ensure authType always exists
  return FormService.retrieveFullFormById(formId)
    .andThen((form) => {
      switch (form.authType) {
        case FormAuthType.MyInfo:
          return validateMyInfoForm(form).andThen((form) =>
            MyInfoService.createRedirectURL({
              formEsrvcId: form.esrvcId,
              formId,
              requestedAttributes: form.getUniqueMyInfoAttrs(),
              encodedQuery,
            }),
          )
        case FormAuthType.SP: {
          return validateSpcpForm(form).asyncAndThen((form) => {
            const target = getRedirectTargetSpcpOidc(
              formId,
              FormAuthType.SP,
              isPersistentLogin,
              encodedQuery,
            )
            return getOidcService(FormAuthType.SP).createRedirectUrl(
              target,
              form.esrvcId,
            )
          })
        }
        case FormAuthType.CP: {
          // NOTE: Persistent login is only set (and relevant) when the authType is SP.
          // If authType is not SP, assume that it was set erroneously and default it to false
          return validateSpcpForm(form).asyncAndThen((form) => {
            const target = getRedirectTargetSpcpOidc(
              formId,
              FormAuthType.CP,
              isPersistentLogin,
              encodedQuery,
            )
            return getOidcService(FormAuthType.CP).createRedirectUrl(
              target,
              form.esrvcId,
            )
          })
        }
        case FormAuthType.SGID:
          return validateSgidForm(form).andThen(() => {
            return SgidService.createRedirectUrl(
              formId,
              Boolean(isPersistentLogin),
              encodedQuery,
            )
          })
        default:
          return err<never, AuthTypeMismatchError>(
            new AuthTypeMismatchError(form.authType),
          )
      }
    })
    .map((redirectURL) => {
      logger.info({
        message: 'Redirecting user to login page',
        meta: {
          redirectURL,
          ...logMeta,
        },
      })
      return res.status(StatusCodes.OK).json({ redirectURL })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while creating redirect URL',
        meta: logMeta,
        error,
      })
      const { statusCode, errorMessage } = mapFormAuthError(error)
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
      encodedQuery: Joi.string().allow('').optional(),
    }),
  }),
  _handleFormAuthRedirect,
] as ControllerHandler[]

/**
 * NOTE: This is exported only for testing
 * Logs user out of SP / CP / MyInfo / SGID by deleting cookie
 * @param authType type of authentication
 *
 * @returns 200 with success message when user logs out successfully
 * @returns 400 if authType is invalid
 */
export const _handlePublicAuthLogout: ControllerHandler<
  {
    authType:
      | FormAuthType.SP
      | FormAuthType.CP
      | FormAuthType.MyInfo
      | FormAuthType.SGID
  },
  PublicFormAuthLogoutDto
> = (req, res) => {
  const { authType } = req.params

  const cookieName = PublicFormService.getCookieNameByAuthType(authType)

  return res
    .clearCookie(cookieName)
    .status(200)
    .json({ message: 'Successfully logged out.' })
}

/**
 * Handler for /forms/auth/:authType/logout
 * Valid AuthTypes are SP / CP / MyInfo / SGID
 */
export const handlePublicAuthLogout = [
  celebrate({
    [Segments.PARAMS]: Joi.object({
      authType: Joi.string()
        .valid(
          FormAuthType.SP,
          FormAuthType.CP,
          FormAuthType.MyInfo,
          FormAuthType.SGID,
        )
        .required(),
    }),
  }),
  _handlePublicAuthLogout,
] as ControllerHandler[]

/**
 * Handler for validating the eServiceId of a given form
 * @deprecated with transition to SP OIDC because NDI no longer returns error page for invalid eservice ID
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
export const handleValidateFormEsrvcId: ControllerHandler<
  { formId: string },
  PublicFormAuthValidateEsrvcIdDto | ErrorDto
> = (req, res) => {
  const { formId } = req.params
  return FormService.retrieveFormById(formId)
    .andThen((form) => {
      // NOTE: Because the check is based on parsing the html of the returned webpage,
      // And because MyInfo login is beyond our control, we coerce MyInfo to SP.
      // This is valid because a valid MyInfo eserviceId is also a valid SP eserviceId
      switch (form.authType) {
        case FormAuthType.MyInfo:
          return validateMyInfoForm(form).andThen((form) =>
            SpcpService.createRedirectUrl(
              FormAuthType.SP,
              formId,
              form.esrvcId,
            ),
          )
        case FormAuthType.SP:
          return validateSpcpForm(form).andThen((form) =>
            SpcpService.createRedirectUrl(form.authType, formId, form.esrvcId),
          )
        default:
          return err<never, AuthTypeMismatchError>(
            new AuthTypeMismatchError(FormAuthType.SP, form.authType),
          )
      }
    })
    .andThen(SpcpService.fetchLoginPage)
    .andThen(SpcpService.validateLoginPage)
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
      const { statusCode, errorMessage } = mapFormAuthError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}
