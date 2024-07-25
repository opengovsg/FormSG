import { HttpStatusCode } from 'axios'
import { celebrate, Joi, Segments } from 'celebrate'
import { StatusCodes } from 'http-status-codes'
import { err, ok, Result } from 'neverthrow'
import { UnreachableCaseError } from 'ts-essentials'

import {
  ErrorCode,
  ErrorDto,
  FormAuthType,
  FormFieldDto,
  PrivateFormErrorDto,
  PublicFormAuthLogoutDto,
  PublicFormAuthRedirectDto,
  PublicFormDto,
  PublicFormViewDto,
} from '../../../../../shared/types'
import { createLoggerWithLabel } from '../../../config/logger'
import { isMongoError } from '../../../utils/handle-mongo-error'
import { createReqMeta, getRequestIp } from '../../../utils/request'
import { getFormIfPublic } from '../../auth/auth.service'
import * as BillingService from '../../billing/billing.service'
import { ControllerHandler } from '../../core/core.types'
import { MyInfoData } from '../../myinfo/myinfo.adapter'
import {
  MYINFO_AUTH_CODE_COOKIE_NAME,
  MYINFO_AUTH_CODE_COOKIE_OPTIONS,
  MYINFO_LOGIN_COOKIE_NAME,
  MYINFO_LOGIN_COOKIE_OPTIONS,
} from '../../myinfo/myinfo.constants'
import { MyInfoService } from '../../myinfo/myinfo.service'
import {
  createMyInfoLoginCookie,
  extractAuthCode,
  validateMyInfoForm,
} from '../../myinfo/myinfo.util'
import { SGIDMyInfoData } from '../../sgid/sgid.adapter'
import {
  SGID_CODE_VERIFIER_COOKIE_NAME,
  SGID_COOKIE_NAME,
  SGID_MYINFO_COOKIE_NAME,
  SGID_MYINFO_LOGIN_COOKIE_NAME,
} from '../../sgid/sgid.constants'
import {
  SgidInvalidJwtError,
  SgidMalformedMyInfoCookieError,
  SgidVerifyJwtError,
} from '../../sgid/sgid.errors'
import { SgidService } from '../../sgid/sgid.service'
import { validateSgidForm } from '../../sgid/sgid.util'
import { InvalidJwtError, VerifyJwtError } from '../../spcp/spcp.errors'
import { getOidcService } from '../../spcp/spcp.oidc.service'
import {
  getRedirectTargetSpcpOidc,
  validateSpcpForm,
} from '../../spcp/spcp.util'
import { generateHashedSubmitterId } from '../../submission/submission.utils'
import { AuthTypeMismatchError, PrivateFormError } from '../form.errors'
import * as FormService from '../form.service'

import * as PublicFormService from './public-form.service'
import { mapFormAuthError, mapRouteError } from './public-form.utils'

const logger = createLoggerWithLabel(module)

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

  if (authType === FormAuthType.NIL) {
    return res.json({ form: publicForm, isIntranetUser })
  }

  let spcpSession
  let myInfoFields

  // extract spcpSession and myInfoFields based on authType
  switch (authType) {
    case FormAuthType.SP: {
      const oidcService = getOidcService(FormAuthType.SP)
      const jwtPayloadResult = await oidcService.extractJwtPayloadFromRequest(
        req.cookies,
      )
      if (jwtPayloadResult.isErr()) {
        const error = jwtPayloadResult.error
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
      }
      spcpSession = jwtPayloadResult.value
      break
    }
    case FormAuthType.CP: {
      const oidcService = getOidcService(FormAuthType.CP)
      const jwtPayloadResult = await oidcService.extractJwtPayloadFromRequest(
        req.cookies,
      )
      if (jwtPayloadResult.isErr()) {
        const error = jwtPayloadResult.error
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
      }
      spcpSession = jwtPayloadResult.value
      break
    }
    case FormAuthType.MyInfo: {
      // We always want to clear existing login cookies because we no longer
      // have the prefilled data
      res.clearCookie(MYINFO_LOGIN_COOKIE_NAME, MYINFO_LOGIN_COOKIE_OPTIONS)
      const authCodeCookie: unknown = req.cookies[MYINFO_AUTH_CODE_COOKIE_NAME]
      // No auth code cookie because user is accessing the form before logging
      // in
      if (!authCodeCookie) {
        return res.json({
          form: publicForm,
          isIntranetUser,
        })
      }
      // Clear auth code cookie once found, as it can't be reused
      res.clearCookie(
        MYINFO_AUTH_CODE_COOKIE_NAME,
        MYINFO_AUTH_CODE_COOKIE_OPTIONS,
      )
      const myInfoFieldsResult = await extractAuthCode(authCodeCookie)
        .asyncAndThen((authCode) => MyInfoService.retrieveAccessToken(authCode))
        .andThen((accessToken) =>
          MyInfoService.getMyInfoDataForForm(form, accessToken),
        )

      if (myInfoFieldsResult.isErr()) {
        const error = myInfoFieldsResult.error
        logger.error({
          message: 'MyInfo login error',
          meta: logMeta,
          error,
        })
        // No need for cookie if data could not be retrieved
        // NOTE: If the user does not have any cookie, clearing the cookie still has the same result
        return res.json({
          form: publicForm,
          errorCodes: [ErrorCode.myInfo],
          isIntranetUser,
        })
      }
      myInfoFields = myInfoFieldsResult.value
      spcpSession = { userName: myInfoFields.getUinFin() }
      break
    }
    case FormAuthType.SGID: {
      const jwtPayloadResult = await SgidService.extractSgidSingpassJwtPayload(
        req.cookies[SGID_COOKIE_NAME],
      )
      if (jwtPayloadResult.isErr()) {
        const error = jwtPayloadResult.error
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
      }
      spcpSession = jwtPayloadResult.value
      break
    }
    case FormAuthType.SGID_MyInfo: {
      const parseSgidMyInfoCookieResult = Result.fromThrowable(
        () =>
          JSON.parse(req.cookies[SGID_MYINFO_COOKIE_NAME] ?? '{}') as {
            jwt?: string
            sub?: string
          },
        (error) => {
          logger.error({
            message: 'Error while calling JSON.parse on SGID MyInfo cookie',
            meta: logMeta,
            error,
          })
          return new SgidMalformedMyInfoCookieError()
        },
      )()

      if (parseSgidMyInfoCookieResult.isErr()) {
        return res.json({
          form: publicForm,
          isIntranetUser,
        })
      }

      const parseSgidMyInfoCookie = parseSgidMyInfoCookieResult.value
      const { jwt: accessToken = '', sub = '' } = parseSgidMyInfoCookie

      if (!accessToken) {
        return res.json({
          form: publicForm,
          isIntranetUser,
        })
      }
      res.clearCookie(SGID_MYINFO_COOKIE_NAME)
      res.clearCookie(SGID_MYINFO_LOGIN_COOKIE_NAME)

      const jwtPayloadResult =
        await SgidService.extractSgidJwtMyInfoPayload(accessToken)
      if (jwtPayloadResult.isErr()) {
        const error = jwtPayloadResult.error
        logger.error({
          message: 'sgID: MyInfo login error',
          meta: logMeta,
          error,
        })
        return res.json({
          form: publicForm,
          errorCodes: [ErrorCode.myInfo],
          isIntranetUser,
        })
      }
      const jwtPayload = jwtPayloadResult.value
      const myInfoFieldsResult = await SgidService.retrieveUserInfo({
        accessToken: jwtPayload.accessToken,
        sub,
      })

      if (myInfoFieldsResult.isErr()) {
        const error = myInfoFieldsResult.error
        logger.error({
          message: 'sgID: MyInfo login error',
          meta: logMeta,
          error,
        })
        return res.json({
          form: publicForm,
          errorCodes: [ErrorCode.myInfo],
          isIntranetUser,
        })
      }

      myInfoFields = new SGIDMyInfoData(myInfoFieldsResult.value.data)
      spcpSession = { userName: myInfoFields.getUinFin() }
      break
    }
    default: {
      return new UnreachableCaseError(authType)
    }
  }

  // validate if respondent is whitelisted
  const hasRespondentNotWhitelistedErrorResult =
    await FormService.checkHasRespondentNotWhitelistedFailure(
      form,
      spcpSession.userName,
    )

  if (hasRespondentNotWhitelistedErrorResult.isErr()) {
    const error = hasRespondentNotWhitelistedErrorResult.error
    logger.error({
      message: 'Error validating respondent whitelisting',
      meta: logMeta,
      error,
    })
    return res.sendStatus(HttpStatusCode.InternalServerError)
  }

  const hasRespondentNotWhitelistedError =
    hasRespondentNotWhitelistedErrorResult.value
  if (hasRespondentNotWhitelistedError) {
    return res.json({
      form: publicForm,
      isIntranetUser,
      errorCodes: [ErrorCode.respondentNotWhitelisted],
    })
  }

  // validate for isSingleSubmission
  const hasSingleSubmissionValidationFailureResult =
    await FormService.checkHasSingleSubmissionValidationFailure(
      publicForm,
      generateHashedSubmitterId(spcpSession.userName, form.id),
    )

  if (hasSingleSubmissionValidationFailureResult.isErr()) {
    const error = hasSingleSubmissionValidationFailureResult.error
    logger.error({
      message: 'Error validating single submission constraint',
      meta: logMeta,
      error,
    })
    return res.sendStatus(HttpStatusCode.InternalServerError)
  }

  const hasSingleSubmissionValidationFailure =
    hasSingleSubmissionValidationFailureResult.value

  // Do not log user in for the form
  // if there is a single submission validation failure
  if (hasSingleSubmissionValidationFailure) {
    spcpSession = undefined
    const authCookieName = PublicFormService.getCookieNameByAuthType(authType)
    res.clearCookie(authCookieName)

    return res.json({
      form: publicForm, // do not need to pre-fill even if MyInfo since user is not logged in
      isIntranetUser,
      errorCodes: [ErrorCode.respondentSingleSubmissionValidationFailure],
    })
  }

  // generate form response based on authType
  switch (authType) {
    case FormAuthType.SP:
    case FormAuthType.CP:
      return res.json({
        form: publicForm,
        isIntranetUser,
        spcpSession,
      })
    case FormAuthType.MyInfo: {
      if (!myInfoFields) {
        logger.error({
          message: 'Failed to load MyInfo fields',
          meta: logMeta,
        })
        // No need for cookie if data could not be retrieved
        // NOTE: If the user does not have any cookie, clearing the cookie still has the same result
        return res.json({
          form: publicForm,
          errorCodes: [ErrorCode.myInfo],
          isIntranetUser,
        })
      }
      await BillingService.recordLoginByForm(form)
      const prefilledFieldsResult =
        await MyInfoService.prefillAndSaveMyInfoFields(
          form._id,
          myInfoFields,
          form.toJSON().form_fields,
        )

      if (prefilledFieldsResult.isErr()) {
        const error = prefilledFieldsResult.error
        logger.error({
          message: 'MyInfo: Failed to prefill and save MyInfo fields',
          meta: logMeta,
          error,
        })
        return res.json({
          form: publicForm,
          errorCodes: [ErrorCode.myInfo],
          isIntranetUser,
        })
      }

      const prefilledFields = prefilledFieldsResult.value

      return res
        .cookie(
          MYINFO_LOGIN_COOKIE_NAME,
          createMyInfoLoginCookie(myInfoFields.getUinFin()),
          MYINFO_LOGIN_COOKIE_OPTIONS,
        )
        .json({
          spcpSession,
          form: {
            ...publicForm,
            form_fields: prefilledFields as FormFieldDto[],
          },
          isIntranetUser,
          myInfoChildrenBirthRecords: (
            myInfoFields as MyInfoData
          ).getChildrenBirthRecords(form.getUniqueMyInfoAttrs()),
        })
    }
    case FormAuthType.SGID:
      return res.json({
        form: publicForm,
        isIntranetUser,
        spcpSession,
      })
    case FormAuthType.SGID_MyInfo: {
      if (!myInfoFields) {
        logger.error({
          message: 'sgID_MyInfo: Failed to load MyInfo fields',
          meta: logMeta,
        })
        // No need for cookie if data could not be retrieved
        // NOTE: If the user does not have any cookie, clearing the cookie still has the same result
        return res.json({
          form: publicForm,
          errorCodes: [ErrorCode.myInfo],
          isIntranetUser,
        })
      }
      const prefilledFieldsResult =
        await MyInfoService.prefillAndSaveMyInfoFields(
          form._id,
          myInfoFields,
          form.toJSON().form_fields,
        )

      if (prefilledFieldsResult.isErr()) {
        const error = prefilledFieldsResult.error
        logger.error({
          message: 'sgID_MyInfo: Failed to prefill and save MyInfo fields',
          meta: logMeta,
          error,
        })
        return res.json({
          form: publicForm,
          errorCodes: [ErrorCode.myInfo],
          isIntranetUser,
        })
      }

      const prefilledFields = prefilledFieldsResult.value
      return res
        .cookie(
          SGID_MYINFO_LOGIN_COOKIE_NAME,
          createMyInfoLoginCookie(myInfoFields.getUinFin()),
          MYINFO_LOGIN_COOKIE_OPTIONS,
        )
        .json({
          form: {
            ...publicForm,
            form_fields: prefilledFields as FormFieldDto[],
          },
          spcpSession: { userName: myInfoFields.getUinFin() },
          isIntranetUser,
        })
    }
    default:
      return new UnreachableCaseError(authType)
  }
}

export const handleGetPublicFormSampleSubmission: ControllerHandler<
  { formId: string },
  | {
      responses: ReturnType<typeof FormService.createSampleSubmissionResponses>
    }
  | ErrorDto
  | PrivateFormErrorDto
> = async (req, res) => {
  const { formId } = req.params
  const logMeta = {
    action: 'handleGetPublicFormSampleSubmission',
    ...createReqMeta(req),
    formId,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formResult = await getFormIfPublic(formId)
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

  const formFields = publicForm.form_fields
  if (!formFields) {
    logger.error({
      message: 'Form fields not found from form public view',
      meta: logMeta,
    })
    return res.sendStatus(HttpStatusCode.InternalServerError)
  }

  let sampleData: ReturnType<typeof FormService.createSampleSubmissionResponses>
  try {
    sampleData = FormService.createSampleSubmissionResponses(formFields)
  } catch (error) {
    logger.error({
      message: 'Error faking sample submission data',
      meta: logMeta,
      error,
    })
    return res.sendStatus(HttpStatusCode.InternalServerError)
  }

  return res.json({ responses: sampleData })
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

  let formAuthType: FormAuthType
  // NOTE: Using retrieveFullForm instead of retrieveForm to ensure authType always exists
  return FormService.retrieveFullFormById(formId)
    .andThen((form) => {
      formAuthType = form.authType
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
          return validateSgidForm(form)
            .andThen(() =>
              SgidService.createRedirectUrl(
                formId,
                Boolean(isPersistentLogin),
                [],
                encodedQuery,
              ),
            )
            .andThen(({ redirectUrl, codeVerifier }) => {
              res.cookie(
                SGID_CODE_VERIFIER_COOKIE_NAME,
                codeVerifier,
                SgidService.getCookieSettings(),
              )
              return ok(redirectUrl)
            })
        case FormAuthType.SGID_MyInfo:
          return validateSgidForm(form)
            .andThen(() =>
              SgidService.createRedirectUrl(
                formId,
                false,
                form.getUniqueMyInfoAttrs(),
                encodedQuery,
              ),
            )
            .andThen(({ redirectUrl, codeVerifier }) => {
              res.cookie(
                SGID_CODE_VERIFIER_COOKIE_NAME,
                codeVerifier,
                SgidService.getCookieSettings(),
              )
              return ok(redirectUrl)
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
          formAuthType,
          ...logMeta,
        },
      })
      return res.status(StatusCodes.OK).json({ redirectURL })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while creating redirect URL',
        meta: {
          formAuthType,
          ...logMeta,
        },
        error,
      })
      const { statusCode, errorMessage } = mapFormAuthError(error)
      res.clearCookie(SGID_CODE_VERIFIER_COOKIE_NAME)
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
      | FormAuthType.SGID_MyInfo
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
          FormAuthType.SGID_MyInfo,
        )
        .required(),
    }),
  }),
  _handlePublicAuthLogout,
] as ControllerHandler[]
