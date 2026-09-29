import { createHmac } from 'crypto'
import { CookieOptions, Response } from 'express'
import {
  FormAuthType,
  FormFieldDto,
  FormWorkflowStepDto,
  MyInfoAttribute,
  WhitelistedSubmitterIdsWithReferenceOid,
  WorkflowStatus,
} from 'formsg-shared/types'
import jwt, { TokenExpiredError } from 'jsonwebtoken'
import { compact, uniq } from 'lodash'
import type { FlattenMaps } from 'mongoose'
import { err, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  IFieldSchema,
  IMultirespondentSubmissionSchema,
  IPopulatedMultirespondentForm,
} from '../../../../types'
import config from '../../../config/config'
import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'
import { ApplicationError } from '../../core/core.errors'
import {
  AuthTypeMismatchError,
  FormAuthNoEsrvcIdError,
  FormWhitelistSettingNotFoundError,
} from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import { getMyInfoAttr } from '../../myinfo/myinfo.util'
import {
  InvalidJwtError,
  MissingJwtError,
  VerifyJwtError,
} from '../../spcp/spcp.errors'
import { getOidcService } from '../../spcp/spcp.oidc.service'
import {
  MrfSubmissionStaleError,
  StepTokenVerificationError,
  SubmissionNotFoundError,
} from '../submission.errors'

import type { MrfStepAuthContext } from './step-auth.types'
import * as stepToken from './step-token'

const MRF_STEP_AUTH_AUDIENCE = 'mrf-step-auth'
const CP_STEP_BINDING_AUDIENCE = 'mrf-step-binding'
const CP_STEP_BINDING_MAX_AGE_MS = 5 * 60 * 1000
// Mirrors the frontend's REDIRECTED_QUERY_KEY (useFetchPrefillQuery.ts)
const PREFILL_QUERY_ID_KEY = 'queryId'

// Derived so these tokens can't be confused with other sessionSecret JWTs.
const MRF_STEP_AUTH_SIGNING_KEY = createHmac('sha256', config.sessionSecret)
  .update('mrf-step-auth')
  .digest()

export type MrfStepWhitelist =
  | { isWhitelistEnabled: false }
  | { isWhitelistEnabled: true; whitelistId: string }

export type ResolvedMrfStepLogin = {
  // Actual provider; later steps are MyInfo or CP only
  authType: Exclude<FormAuthType, FormAuthType.NIL>
  isSubmitterIdCollectionEnabled: boolean
  whitelist: MrfStepWhitelist
  esrvcId?: string
}

export type ResolvedMrfStepAuth = {
  // Zero-indexed step being filled in
  workflowStep: number
  // Fields editable at this step, from the submission's copy for later steps
  stepFields: FormFieldDto[]
  // Absent when the step has no login
  login?: ResolvedMrfStepLogin
  // Present for a later step with login; binds provider sessions to it
  context?: MrfStepAuthContext
  // Verified login, once checked against the continuation cookie
  session?: VerifiedMrfStepAuth
}

// How the caller proves it may act on the pending step
export type MrfStepCredential =
  | { stepToken?: string }
  // Context signed at login start, checked against the current step instead
  | { binding: MrfStepAuthContext }
  // For routes without the step token (eg OTP). A login step's cookie is only
  // issued after its token was checked, so it stands in for the token. Steps
  // without login pass; the caller must prove access some other way.
  | { stepAuthCookies: Record<string, string | undefined> }

export type ResolveMrfStepAuthError =
  | SubmissionNotFoundError
  | StepTokenVerificationError
  | MrfSubmissionStaleError
  | AuthTypeMismatchError
  | FormAuthNoEsrvcIdError
  | FormWhitelistSettingNotFoundError
  | MissingJwtError
  | VerifyJwtError
  | InvalidJwtError

export type MrfStepAuthCookiePayload = MrfStepAuthContext & {
  // NRIC/FIN for MyInfo, UEN for CP
  userName: string
  // CP UID
  userInfo?: string
  // Consumed MyInfo FAPI session; scopes this login's MyInfo hashes
  myInfoAuthSessionId?: string
}

export type VerifiedMrfStepAuth = MrfStepAuthCookiePayload & {
  iat: number
  exp: number
}

export class CpStepBindingExpiredError extends ApplicationError {
  // Signature-verified context, only used to return the respondent to the step
  context: MrfStepAuthContext
  constructor(context: MrfStepAuthContext) {
    super('Corppass step login binding expired')
    this.context = context
  }
}

/**
 * Fields a step may fill in. Step 1 of a form without a workflow fills in all
 * fields.
 */
export const getMrfStepFields = <F extends { _id?: unknown }>(
  formFields: F[],
  workflow: Pick<FormWorkflowStepDto, 'edit'>[],
  stepIndex: number,
): F[] => {
  const step = workflow[stepIndex]
  if (!step) {
    return stepIndex === 0 && workflow.length === 0 ? formFields : []
  }
  const editIds = new Set(step.edit.map(String))
  return formFields.filter((field) => editIds.has(String(field._id)))
}

/**
 * Unique MyInfo attributes to request for the given fields, with compound
 * fields exploded.
 */
export const getMyInfoAttrsForFields = (
  fields: (FormFieldDto | FlattenMaps<IFieldSchema> | IFieldSchema)[],
): MyInfoAttribute[] =>
  compact(
    uniq(
      fields.flatMap((field) =>
        // Plain field DTOs carry the same myInfo shape as schema fields.
        getMyInfoAttr(field as FlattenMaps<IFieldSchema>),
      ),
    ),
  ) as MyInfoAttribute[]

export const isSameMrfStepAuthContext = (
  a: MrfStepAuthContext,
  b: MrfStepAuthContext,
): boolean =>
  a.formId === b.formId &&
  a.submissionId === b.submissionId &&
  a.workflowStep === b.workflowStep &&
  a.authType === b.authType &&
  (a.stepTokenHash ?? '') === (b.stepTokenHash ?? '')

/**
 * Resolves who may fill in the pending step of an MRF submission, from the
 * submission's own copy of the workflow and e-service ID; the live form's
 * login settings never apply to a later step.
 */
export const resolveMrfStepAuth = (
  form: IPopulatedMultirespondentForm,
  submission: IMultirespondentSubmissionSchema,
  credential: MrfStepCredential = {},
): Result<ResolvedMrfStepAuth, ResolveMrfStepAuthError> => {
  const formId = String(form._id)
  const submissionId = String(submission._id)
  if (String(submission.form?._id ?? submission.form) !== formId) {
    return err(new SubmissionNotFoundError())
  }

  // A binding or cookie was signed with the token hash; compared further down.
  if (
    !('binding' in credential) &&
    !('stepAuthCookies' in credential) &&
    submission.stepTokenHash &&
    (!credential.stepToken ||
      !stepToken.verify(credential.stepToken, submission.stepTokenHash))
  ) {
    return err(new StepTokenVerificationError())
  }

  const workflow = submission.workflow ?? []
  const workflowStep = submission.workflowStep + 1
  const isRejected = (submission.submittedSteps ?? []).some(
    (step) => step.isApproval && step.status === WorkflowStatus.REJECTED,
  )
  if (isRejected || workflowStep >= workflow.length) {
    return err(new MrfSubmissionStaleError())
  }

  const stepFields = getMrfStepFields(
    submission.form_fields ?? [],
    workflow,
    workflowStep,
  )
  const auth = workflow[workflowStep].auth
  if (!auth) {
    // A binding always names a login step, so this step has since changed.
    if ('binding' in credential) {
      return err(new StepTokenVerificationError())
    }
    return ok({ workflowStep, stepFields })
  }

  const authType = auth.auth_type
  if (authType !== FormAuthType.MyInfo && authType !== FormAuthType.CP) {
    return err(new AuthTypeMismatchError(FormAuthType.CP, authType))
  }
  const { esrvcId } = submission
  if (authType === FormAuthType.CP && !esrvcId) {
    return err(new FormAuthNoEsrvcIdError(formId))
  }
  // Raw copy keeps the list reference that public projections strip.
  const savedWhitelist = auth.whitelisted_submitter_ids as
    | Partial<WhitelistedSubmitterIdsWithReferenceOid>
    | null
    | undefined
  if (
    savedWhitelist?.isWhitelistEnabled &&
    !savedWhitelist.encryptedWhitelistedSubmitterIds
  ) {
    return err(new FormWhitelistSettingNotFoundError())
  }

  const context: MrfStepAuthContext = {
    formId,
    submissionId,
    workflowStep,
    authType,
    ...(submission.stepTokenHash
      ? { stepTokenHash: submission.stepTokenHash }
      : {}),
  }
  if (
    'binding' in credential &&
    !isSameMrfStepAuthContext(credential.binding, context)
  ) {
    return err(new StepTokenVerificationError())
  }

  const resolved: ResolvedMrfStepAuth = {
    workflowStep,
    stepFields,
    context,
    login: {
      authType,
      isSubmitterIdCollectionEnabled: !!auth.is_submitter_id_collection_enabled,
      whitelist: savedWhitelist?.isWhitelistEnabled
        ? {
            isWhitelistEnabled: true,
            whitelistId: String(
              savedWhitelist.encryptedWhitelistedSubmitterIds,
            ),
          }
        : { isWhitelistEnabled: false },
      esrvcId,
    },
  }
  if ('stepAuthCookies' in credential) {
    return verifyMrfStepAuthCookie(credential.stepAuthCookies, context).map(
      (session) => ({ ...resolved, session }),
    )
  }
  return ok(resolved)
}

/**
 * Whether the identity may fill in the step, checked against the list the
 * step was resolved with. A missing list record is an error, not a pass.
 */
export const checkMrfStepEligibility = (
  form: IPopulatedMultirespondentForm,
  login: ResolvedMrfStepLogin,
  submitterId: string,
): ResultAsync<boolean, ApplicationError> =>
  login.whitelist.isWhitelistEnabled
    ? FormService.checkIsSubmitterNotWhitelisted({
        formId: String(form._id),
        formPublicKey: form.publicKey,
        whitelistId: login.whitelist.whitelistId,
        submitterId,
      }).map((isNotWhitelisted) => !isNotWhitelisted)
    : okAsync(true)

/**
 * Respondent path to return to after a later step's login. Only the prefill
 * query ID is carried over; the submission key and step token stay in the
 * browser.
 */
export const getMrfContinuationDestination = ({
  formId,
  submissionId,
  query,
}: {
  formId: string
  submissionId: string
  // Decoded query from the login's encodedQuery
  query?: string
}): string => {
  const base = `/${formId}/edit/${submissionId}`
  const queryId = new URLSearchParams(query ?? '').get(PREFILL_QUERY_ID_KEY)
  return queryId && /^[\w-]+$/.test(queryId)
    ? `${base}?${PREFILL_QUERY_ID_KEY}=${queryId}`
    : base
}

export const getMrfStepAuthCookieName = ({
  formId,
  submissionId,
}: {
  formId: string
  submissionId: string
}): string => `mrfStepAuth_${formId}_${submissionId}`

// Corppass cookies may be shared across subdomains; MyInfo ones are host-only.
const getCorppassCookieDomain = (): string | undefined => {
  const settings = getOidcService(FormAuthType.CP).getCookieSettings()
  return 'domain' in settings ? settings.domain : undefined
}

// Path covers the form's submission and OTP routes, and nothing else.
const getMrfStepAuthCookieOptions = (
  formId: string,
  domain?: string,
): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: !config.isDevOrTest,
  path: `/api/v3/forms/${formId}`,
  ...(domain ? { domain } : {}),
})

export const setMrfStepAuthCookie = (
  res: Response,
  session: MrfStepAuthCookiePayload,
): void => {
  const isCorppass = session.authType === FormAuthType.CP
  const maxAge = isCorppass
    ? getOidcService(FormAuthType.CP).getCookieDuration()
    : spcpMyInfoConfig.spCookieMaxAge
  const payload: MrfStepAuthCookiePayload = {
    formId: session.formId,
    submissionId: session.submissionId,
    workflowStep: session.workflowStep,
    authType: session.authType,
    ...(session.stepTokenHash ? { stepTokenHash: session.stepTokenHash } : {}),
    userName: session.userName,
    ...(isCorppass
      ? { userInfo: session.userInfo }
      : { myInfoAuthSessionId: session.myInfoAuthSessionId }),
  }
  const token = jwt.sign(payload, MRF_STEP_AUTH_SIGNING_KEY, {
    algorithm: 'HS256',
    audience: MRF_STEP_AUTH_AUDIENCE,
    expiresIn: Math.floor(maxAge / 1000),
  })
  res.cookie(getMrfStepAuthCookieName(session), token, {
    ...getMrfStepAuthCookieOptions(
      session.formId,
      isCorppass ? getCorppassCookieDomain() : undefined,
    ),
    maxAge,
  })
}

/**
 * Clears the continuation cookie for one submission, whichever provider set it.
 */
export const clearMrfStepAuthCookie = (
  res: Response,
  { formId, submissionId }: { formId: string; submissionId: string },
): void => {
  const name = getMrfStepAuthCookieName({ formId, submissionId })
  res.clearCookie(name, getMrfStepAuthCookieOptions(formId))
  const corppassDomain = getCorppassCookieDomain()
  if (corppassDomain) {
    res.clearCookie(name, getMrfStepAuthCookieOptions(formId, corppassDomain))
  }
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const isMrfStepAuthContext = (value: unknown): value is MrfStepAuthContext => {
  if (typeof value !== 'object' || value === null) return false
  const context = value as Record<string, unknown>
  return (
    isNonEmptyString(context.formId) &&
    isNonEmptyString(context.submissionId) &&
    Number.isInteger(context.workflowStep) &&
    (context.authType === FormAuthType.MyInfo ||
      context.authType === FormAuthType.CP) &&
    (context.stepTokenHash === undefined ||
      isNonEmptyString(context.stepTokenHash))
  )
}

const isVerifiedMrfStepAuth = (
  value: unknown,
): value is VerifiedMrfStepAuth => {
  if (!isMrfStepAuthContext(value)) return false
  const session = value as Record<string, unknown>
  if (
    !isNonEmptyString(session.userName) ||
    typeof session.iat !== 'number' ||
    typeof session.exp !== 'number'
  ) {
    return false
  }
  return value.authType === FormAuthType.CP
    ? isNonEmptyString(session.userInfo)
    : isNonEmptyString(session.myInfoAuthSessionId)
}

/**
 * Verifies the continuation cookie for the step the caller resolved. Callers
 * should clear the cookie on VerifyJwtError or InvalidJwtError.
 * @returns err(MissingJwtError) when the respondent has not logged in
 * @returns err(VerifyJwtError) when the signature, audience or expiry fails
 * @returns err(InvalidJwtError) when the payload is malformed or for another context
 */
export const verifyMrfStepAuthCookie = (
  cookies: Record<string, string | undefined>,
  expected: MrfStepAuthContext,
): Result<
  VerifiedMrfStepAuth,
  MissingJwtError | VerifyJwtError | InvalidJwtError
> => {
  const token = cookies[getMrfStepAuthCookieName(expected)]
  if (!token) {
    return err(new MissingJwtError())
  }
  return Result.fromThrowable(
    () =>
      jwt.verify(token, MRF_STEP_AUTH_SIGNING_KEY, {
        algorithms: ['HS256'],
        audience: MRF_STEP_AUTH_AUDIENCE,
      }),
    () => new VerifyJwtError(),
  )().andThen((decoded) =>
    isVerifiedMrfStepAuth(decoded) &&
    isSameMrfStepAuthContext(decoded, expected)
      ? ok(decoded)
      : err(new InvalidJwtError()),
  )
}

export const getCpStepBindingCookieName = (nonce: string): string =>
  `cpStepBinding_${nonce}`

/**
 * Binds a Corppass login started for a later step to that step. Uses the
 * PKCE cookie's options so the callback can read it.
 */
export const setCpStepBindingCookie = (
  res: Response,
  context: MrfStepAuthContext,
  nonce: string,
): void => {
  const token = jwt.sign({ ...context, nonce }, MRF_STEP_AUTH_SIGNING_KEY, {
    algorithm: 'HS256',
    audience: CP_STEP_BINDING_AUDIENCE,
    expiresIn: CP_STEP_BINDING_MAX_AGE_MS / 1000,
  })
  res.cookie(getCpStepBindingCookieName(nonce), token, {
    ...getOidcService(FormAuthType.CP).getCodeVerifierCookieOptions(),
    // Outlives the JWT, or the browser drops the cookie at the same moment
    // the token expires and the callback can't tell expired from missing.
    maxAge: CP_STEP_BINDING_MAX_AGE_MS * 2,
  })
}

export const clearCpStepBindingCookie = (
  res: Response,
  nonce: string,
): void => {
  res.clearCookie(
    getCpStepBindingCookieName(nonce),
    getOidcService(FormAuthType.CP).getCodeVerifierCookieOptions(),
  )
}

/**
 * Verifies a Corppass step binding against the nonce in the callback state.
 * @returns err(CpStepBindingExpiredError) for a genuine but expired binding
 * @returns err(InvalidJwtError) for any other failure
 */
export const verifyCpStepBinding = (
  token: string,
  nonce: string,
): Result<MrfStepAuthContext, CpStepBindingExpiredError | InvalidJwtError> => {
  const verify = (ignoreExpiration: boolean) =>
    Result.fromThrowable(
      () =>
        jwt.verify(token, MRF_STEP_AUTH_SIGNING_KEY, {
          algorithms: ['HS256'],
          audience: CP_STEP_BINDING_AUDIENCE,
          ignoreExpiration,
        }),
      (error) => error,
    )().andThen((decoded) => {
      if (
        !isMrfStepAuthContext(decoded) ||
        !('nonce' in decoded) ||
        decoded.nonce !== nonce
      ) {
        return err(new InvalidJwtError())
      }
      const { formId, submissionId, workflowStep, authType, stepTokenHash } =
        decoded
      return ok<MrfStepAuthContext, unknown>({
        formId,
        submissionId,
        workflowStep,
        authType,
        ...(stepTokenHash ? { stepTokenHash } : {}),
      })
    })

  return verify(false).orElse((error) => {
    if (!(error instanceof TokenExpiredError)) {
      return err(new InvalidJwtError())
    }
    return verify(true)
      .mapErr(() => new InvalidJwtError())
      .andThen((context) => err(new CpStepBindingExpiredError(context)))
  })
}
