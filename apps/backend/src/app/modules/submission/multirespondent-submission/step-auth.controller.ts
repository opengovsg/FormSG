import { celebrate, Joi, Segments } from 'celebrate'
import { randomBytes } from 'crypto'
import { Request } from 'express'
import { featureFlags } from 'formsg-shared/constants'
import {
  ErrorCode,
  ErrorDto,
  FormAuthType,
  FormFieldDto,
  MrfStepAuthRedirectRequestDto,
  MrfStepAuthRequestDto,
  MrfStepAuthSessionDto,
  PublicFormAuthLogoutDto,
  PublicFormAuthRedirectDto,
} from 'formsg-shared/types'
import { stripDropdownFieldOptionsToRecipientsMap } from 'formsg-shared/utils/strip-dropdown-field-optionsToRecipientsMap'
import { StatusCodes } from 'http-status-codes'
import { FlattenMaps } from 'mongoose'
import { errAsync } from 'neverthrow'

import { IFieldSchema } from '../../../../types'
import { createLoggerWithLabel } from '../../../config/logger'
import { createReqMeta } from '../../../utils/request'
import * as AuthService from '../../auth/auth.service'
import { ControllerHandler } from '../../core/core.types'
import {
  AuthTypeMismatchError,
  FormAuthNoEsrvcIdError,
} from '../../form/form.errors'
import { MYINFO_FAPI_SESSION_COOKIE_NAME } from '../../myinfo/fapi/myinfo.fapi.constants'
import {
  clearMyInfoFapiSessionCookie,
  setMyInfoFapiSessionCookie,
} from '../../myinfo/fapi/myinfo.fapi.controller'
import {
  MyInfoFapiIncompleteLoginError,
  MyInfoFapiSessionFormMismatchError,
} from '../../myinfo/fapi/myinfo.fapi.errors'
import * as MyInfoFapiService from '../../myinfo/fapi/myinfo.fapi.service'
import { MyInfoService } from '../../myinfo/myinfo.service'
import {
  getUniqueMyInfoAttrsForFields,
  shouldFetchSponsoredChildren,
} from '../../myinfo/myinfo.util'
import { MissingJwtError } from '../../spcp/spcp.errors'
import { getOidcService } from '../../spcp/spcp.oidc.service'
import { getRedirectTargetSpcpOidc } from '../../spcp/spcp.util'
import { mapRouteError, sendRouteError } from '../submission.utils'

import {
  checkFormIsMultirespondent,
  getMultirespondentSubmission,
} from './multirespondent-submission.service'
import {
  clearMrfStepAuthCookie,
  prefillLoginIdentityFields,
  resolveMrfStepAuth,
  setCpStepBindingCookie,
  setMrfStepAuthCookie,
  toMyInfoMrfContext,
  verifyMrfStepAuthCookie,
  withMrfStepLoginMarker,
} from './step-auth'

const logger = createLoggerWithLabel(module)

type MrfStepAuthParams = { formId: string; submissionId: string }

const loadPendingStepAuth = (
  req: Pick<Request<MrfStepAuthParams>, 'params' | 'growthbook'>,
  stepToken?: string,
) => {
  const { formId, submissionId } = req.params
  return AuthService.getFormIfPublic(formId)
    .andThen(checkFormIsMultirespondent)
    .andThen((form) => {
      // Lets feature flags (eg mrf-children) target this form.
      void req.growthbook?.setAttributes({
        ...req.growthbook.getAttributes(),
        formId,
        adminEmail: form.admin.email,
      })
      return getMultirespondentSubmission(submissionId).andThen((submission) =>
        resolveMrfStepAuth(formId, submission, { stepToken }).map(
          (resolved) => ({ form, resolved }),
        ),
      )
    })
}

const mrfStepTokenBody = { stepToken: Joi.string().optional() }

/**
 * Starts the login for the pending step of an MRF submission, using that
 * step's saved provider and, for Corppass, the step's own e-service ID.
 * @returns 200 with the provider redirect URL
 * @returns 400 when the step has no login
 * @returns 403 when the step token is invalid
 * @returns 409 when the submission is completed or rejected
 */
export const _handleMrfStepAuthRedirect: ControllerHandler<
  MrfStepAuthParams,
  PublicFormAuthRedirectDto | ErrorDto,
  MrfStepAuthRedirectRequestDto
> = async (req, res) => {
  const { formId, submissionId } = req.params
  const { stepToken, encodedQuery } = req.body
  const logMeta = {
    action: 'handleMrfStepAuthRedirect',
    formId,
    submissionId,
    ...createReqMeta(req),
  }

  return loadPendingStepAuth(req, stepToken)
    .andThen(({ form, resolved: { context, stepFields, esrvcId } }) => {
      if (!context) {
        return errAsync(new AuthTypeMismatchError(FormAuthType.NIL))
      }
      if (context.authType === FormAuthType.MyInfo) {
        // Fail closed: without a growthbook instance, only birth records are fetched.
        const isMrfChildrenEnabled =
          req.growthbook?.isOn(featureFlags.mrfChildren) ?? false
        return MyInfoFapiService.startLogin({
          formId,
          encodedQuery,
          requestedAttributes: getUniqueMyInfoAttrsForFields(stepFields),
          includeSponsoredChildren: shouldFetchSponsoredChildren(
            form,
            isMrfChildrenEnabled,
          ),
          mrfContext: toMyInfoMrfContext(context),
        }).map(({ sessionId, redirectUrl }) => {
          setMyInfoFapiSessionCookie(res, sessionId)
          return redirectUrl
        })
      }
      if (!esrvcId) {
        return errAsync(new FormAuthNoEsrvcIdError(formId))
      }
      // Always nonce-scoped: the nonce names both the PKCE and binding cookies.
      const nonce = randomBytes(16).toString('hex')
      const oidcService = getOidcService(FormAuthType.CP)
      return oidcService
        .createRedirectUrl(
          getRedirectTargetSpcpOidc(
            formId,
            FormAuthType.CP,
            false,
            withMrfStepLoginMarker(encodedQuery, submissionId),
            nonce,
          ),
          esrvcId,
        )
        .map(({ redirectUrl, codeVerifier }) => {
          res.cookie(
            oidcService.getCodeVerifierCookieName(nonce),
            codeVerifier,
            oidcService.getCodeVerifierCookieOptions(),
          )
          setCpStepBindingCookie(res, context, nonce)
          return redirectUrl
        })
    })
    .map((redirectURL) => {
      logger.info({
        message: 'Redirecting MRF step respondent to login page',
        meta: logMeta,
      })
      return res.status(StatusCodes.OK).json({ redirectURL })
    })
    .mapErr((error) => {
      logger.error({
        message: 'Error while creating MRF step login redirect URL',
        meta: logMeta,
        error,
      })
      return sendRouteError(res, mapRouteError(error))
    })
}

export const handleMrfStepAuthRedirect = [
  celebrate({
    [Segments.BODY]: Joi.object({
      ...mrfStepTokenBody,
      // base64 of the prefill query ID; never contains the state separator '-'
      encodedQuery: Joi.string()
        .base64({ paddingRequired: false })
        .allow('')
        .optional(),
    }),
  }),
  _handleMrfStepAuthRedirect,
] as ControllerHandler[]

/**
 * Returns the pending step's login requirement and, once logged in, its
 * session. Completes a MyInfo login bound to this step: prefills this step's
 * fields only and scopes the MyInfo hashes to the consumed login session.
 * @returns 200 with the step's login requirement and session
 * @returns 403 when the step token is invalid
 * @returns 409 when the submission is completed or rejected
 */
export const _handleMrfStepAuthSession: ControllerHandler<
  MrfStepAuthParams,
  MrfStepAuthSessionDto | ErrorDto,
  MrfStepAuthRequestDto
> = async (req, res) => {
  const { formId, submissionId } = req.params
  const logMeta = {
    action: 'handleMrfStepAuthSession',
    formId,
    submissionId,
    ...createReqMeta(req),
  }

  const loadResult = await loadPendingStepAuth(req, req.body.stepToken)
  if (loadResult.isErr()) {
    logger.warn({
      message: 'Failed to resolve MRF step login',
      meta: logMeta,
      error: loadResult.error,
    })
    return sendRouteError(res, mapRouteError(loadResult.error))
  }
  const { context, stepFields, workflowStep } = loadResult.value.resolved
  const policy: MrfStepAuthSessionDto = {
    workflowStep,
    authType: context?.authType ?? FormAuthType.NIL,
  }
  if (!context) {
    return res.json(policy)
  }

  // A completed MyInfo login for this step takes precedence over an older one.
  const fapiSessionId: unknown =
    req.signedCookies?.[MYINFO_FAPI_SESSION_COOKIE_NAME]
  if (
    context.authType === FormAuthType.MyInfo &&
    typeof fapiSessionId === 'string' &&
    fapiSessionId
  ) {
    const personResult = await MyInfoFapiService.loadPersonForSession({
      sessionId: fapiSessionId,
      formId,
      mrfContext: toMyInfoMrfContext(context),
    })
    if (personResult.isOk()) {
      clearMyInfoFapiSessionCookie(res)
      const myInfoData = personResult.value
      const uinFin = myInfoData.getUinFin()
      // Reauthentication replaces this step's hashes under a new session ID.
      const prefillResult = await MyInfoService.prefillAndSaveMyInfoFields(
        formId,
        myInfoData,
        stepFields as unknown as FlattenMaps<IFieldSchema[]>,
        { authSessionId: fapiSessionId, workflowStep },
      )
      if (prefillResult.isErr()) {
        logger.error({
          message: 'MyInfo: Failed to prefill and save MRF step fields',
          meta: logMeta,
          error: prefillResult.error,
        })
        clearMrfStepAuthCookie(res, context)
        return res.json({ ...policy, errorCodes: [ErrorCode.myInfo] })
      }

      const session = {
        ...context,
        authType: FormAuthType.MyInfo as const,
        uinFin,
        myInfoAuthSessionId: fapiSessionId,
      }
      setMrfStepAuthCookie(res, session)
      // MyInfo prefill skips the login's own NRIC/FIN; it comes from the session.
      const identityPrefills = new Map(
        prefillLoginIdentityFields(stepFields, session).map((field) => [
          String(field._id),
          field,
        ]),
      )
      const prefilledFields = (prefillResult.value as FormFieldDto[]).map(
        (field) => identityPrefills.get(String(field._id)) ?? field,
      )
      logger.info({
        message: 'MRF step login succeeded',
        meta: { ...logMeta, workflowStep, authType: FormAuthType.MyInfo },
      })
      return res.json({
        ...policy,
        spcpSession: { userName: uinFin },
        prefilledFields:
          stripDropdownFieldOptionsToRecipientsMap(prefilledFields),
        myInfoChildrenBirthRecords: myInfoData.getChildrenBirthRecords(
          getUniqueMyInfoAttrsForFields(stepFields),
        ),
      })
    }

    const { error } = personResult
    // Another tab's login (other form or step) is left for that tab.
    if (!(error instanceof MyInfoFapiSessionFormMismatchError)) {
      clearMyInfoFapiSessionCookie(res)
    }
    if (
      !(error instanceof MyInfoFapiIncompleteLoginError) &&
      !(error instanceof MyInfoFapiSessionFormMismatchError)
    ) {
      logger.error({
        message: 'MyInfo MRF step login error',
        meta: logMeta,
        error,
      })
      clearMrfStepAuthCookie(res, context)
      return res.json({ ...policy, errorCodes: [ErrorCode.myInfo] })
    }
  } else if (req.cookies?.[MYINFO_FAPI_SESSION_COOKIE_NAME]) {
    // Present but unreadable (e.g. rotated SESSION_SECRET).
    clearMyInfoFapiSessionCookie(res)
  }

  // Already logged in for this step. Identities come from the session; MyInfo
  // profile data is not refetched.
  const cookieResult = verifyMrfStepAuthCookie(req.cookies ?? {}, context)
  if (cookieResult.isErr()) {
    if (!(cookieResult.error instanceof MissingJwtError)) {
      clearMrfStepAuthCookie(res, context)
    }
    return res.json(policy)
  }
  const session = cookieResult.value
  return res.json({
    ...policy,
    spcpSession: {
      userName:
        session.authType === FormAuthType.MyInfo
          ? session.uinFin
          : session.userName,
      iat: session.iat,
      exp: session.exp,
    },
    prefilledFields: stripDropdownFieldOptionsToRecipientsMap(
      prefillLoginIdentityFields(stepFields, session),
    ),
  })
}

export const handleMrfStepAuthSession = [
  celebrate({ [Segments.BODY]: Joi.object(mrfStepTokenBody) }),
  _handleMrfStepAuthSession,
] as ControllerHandler[]

/**
 * Logs out of the pending step of one MRF submission only. A pending MyInfo
 * login is discarded only if it was started for this submission.
 */
export const _handleMrfStepAuthLogout: ControllerHandler<
  MrfStepAuthParams,
  PublicFormAuthLogoutDto
> = async (req, res) => {
  const { formId, submissionId } = req.params
  clearMrfStepAuthCookie(res, { formId, submissionId })

  const fapiSessionId: unknown =
    req.signedCookies?.[MYINFO_FAPI_SESSION_COOKIE_NAME]
  if (typeof fapiSessionId === 'string' && fapiSessionId) {
    const boundResult = await MyInfoFapiService.isSessionBoundToSubmission({
      sessionId: fapiSessionId,
      formId,
      submissionId,
    })
    if (boundResult.isOk() && boundResult.value) {
      clearMyInfoFapiSessionCookie(res)
    }
  }

  return res
    .status(StatusCodes.OK)
    .json({ message: 'Successfully logged out.' })
}

export const handleMrfStepAuthLogout = [
  celebrate({ [Segments.BODY]: Joi.object({}) }),
  _handleMrfStepAuthLogout,
] as ControllerHandler[]
