import { createHmac } from 'crypto'
import { CookieOptions, Response } from 'express'
import {
  CorppassAttribute,
  FormAuthType,
  FormFieldDto,
  WorkflowStatus,
} from 'formsg-shared/types'
import {
  getLoginIdentityAttr,
  getLoginIdentityAttrsForAuthType,
} from 'formsg-shared/utils/login-identity'
import { getStepFields, SourceField } from 'formsg-shared/utils/step-login'
import jwt, { TokenExpiredError } from 'jsonwebtoken'
import { err, ok, Result } from 'neverthrow'
import { z } from 'zod'

import {
  Environment,
  IMultirespondentSubmissionSchema,
} from '../../../../types'
import config from '../../../config/config'
import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'
import { ApplicationError } from '../../core/core.errors'
import type { MyInfoMrfSessionContext } from '../../myinfo/fapi/myinfo.fapi.session.model'
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

import * as stepToken from './step-token'

const MRF_STEP_AUTH_AUDIENCE = 'mrf-step-auth'
const CP_STEP_BINDING_AUDIENCE = 'mrf-step-binding'
const CP_STEP_BINDING_MAX_AGE_MS = 5 * 60 * 1000
// Mirrors the frontend's REDIRECTED_QUERY_KEY (useFetchPrefillQuery.ts)
const PREFILL_QUERY_ID_KEY = 'queryId'

// Marks a later step's Corppass login in its OIDC state. A callback that has
// lost its binding cookie must not be handled as a Step 1 login.
const MRF_STEP_LOGIN_QUERY_KEY = 'mrfStepSubmissionId'

/** Base64 decoding of a string never throws. */
export const decodeQuery = (encodedQuery?: string): string | undefined =>
  encodedQuery
    ? Buffer.from(encodedQuery, 'base64').toString('utf8')
    : undefined

/** The login's encodedQuery with the later-step marker added. */
export const withMrfStepLoginMarker = (
  encodedQuery: string | undefined,
  submissionId: string,
): string => {
  const params = new URLSearchParams(decodeQuery(encodedQuery))
  params.set(MRF_STEP_LOGIN_QUERY_KEY, submissionId)
  return Buffer.from(params.toString()).toString('base64')
}

/** The submission a Corppass callback's state marks it for, if any. */
export const getMrfStepLoginSubmissionId = (
  query?: string,
): string | undefined => {
  const submissionId = new URLSearchParams(query ?? '').get(
    MRF_STEP_LOGIN_QUERY_KEY,
  )
  return submissionId && /^[a-fA-F0-9]{24}$/.test(submissionId)
    ? submissionId
    : undefined
}

// Derived so these tokens can't be confused with other sessionSecret JWTs.
const MRF_STEP_AUTH_SIGNING_KEY = createHmac('sha256', config.sessionSecret)
  .update('mrf-step-auth')
  .digest()

const NonEmptyString = z.string().min(1)

// Signed into the step login cookie and the Corppass step binding, so these
// schemas both type and parse them.
const MrfStepAuthContextSchema = z.object({
  formId: NonEmptyString,
  submissionId: NonEmptyString,
  // Zero-indexed step of the submission's saved workflow
  workflowStep: z.number().int(),
  authType: z.union([
    z.literal(FormAuthType.MyInfo),
    z.literal(FormAuthType.CP),
  ]),
  stepTokenHash: NonEmptyString.optional(),
})

// Step 2+ login cookie (Step 1 uses MyInfoCookie and jwtCp)
const MyInfoStepLoginSchema = z.object({
  authType: z.literal(FormAuthType.MyInfo),
  uinFin: NonEmptyString,
  // Consumed MyInfo FAPI session; scopes this login's MyInfo hashes
  myInfoAuthSessionId: NonEmptyString,
})

const CorppassStepLoginSchema = z.object({
  authType: z.literal(FormAuthType.CP),
  // Entity UEN
  userName: NonEmptyString,
  // Representative UID
  userInfo: NonEmptyString,
})

const JwtTimesSchema = z.object({ iat: z.number(), exp: z.number() })

const VerifiedMrfStepAuthSchema = z.discriminatedUnion('authType', [
  MrfStepAuthContextSchema.merge(MyInfoStepLoginSchema).merge(JwtTimesSchema),
  MrfStepAuthContextSchema.merge(CorppassStepLoginSchema).merge(JwtTimesSchema),
])

const CpStepBindingSchema = MrfStepAuthContextSchema.extend({
  nonce: z.string(),
})

/** Binds a later step's login to one submission, step and provider. */
export type MrfStepAuthContext = z.infer<typeof MrfStepAuthContextSchema>

type StepLoginIdentity =
  | z.infer<typeof MyInfoStepLoginSchema>
  | z.infer<typeof CorppassStepLoginSchema>

export type MrfStepAuthCookiePayload = MrfStepAuthContext & StepLoginIdentity

type VerifiedMrfStepAuth = z.infer<typeof VerifiedMrfStepAuthSchema>

export type ResolvedMrfStepAuth = {
  workflowStep: number
  workflowStepId: string
  // Fields this step may fill in, from the submission's saved form
  stepFields: FormFieldDto[]
  // Present when the step requires login
  context?: MrfStepAuthContext
  // The Corppass step's own e-service ID, from the submission's saved workflow
  esrvcId?: string
  // Verified login, once checked against the continuation cookie
  session?: VerifiedMrfStepAuth
}

// How the caller proves it may act on the pending step
type MrfStepCredential =
  | { stepToken?: string }
  // Context signed at login start, checked against the current step instead
  | { binding: MrfStepAuthContext }
  // For routes without the step token (eg OTP). A login step's cookie is only
  // issued after its token was checked, so it stands in for the token. Steps
  // without login pass; the caller must prove access some other way.
  | { stepAuthCookies: Record<string, string | undefined> }

type ResolveMrfStepAuthError =
  | SubmissionNotFoundError
  | StepTokenVerificationError
  | MrfSubmissionStaleError
  | MissingJwtError
  | VerifyJwtError
  | InvalidJwtError

export class CpStepBindingExpiredError extends ApplicationError {
  // Signature-verified context, only used to return the respondent to the step
  context: MrfStepAuthContext
  constructor(context: MrfStepAuthContext) {
    super('Corppass step login binding expired')
    this.context = context
  }
}

export const toMyInfoMrfContext = ({
  submissionId,
  workflowStep,
  stepTokenHash,
}: MrfStepAuthContext): MyInfoMrfSessionContext => ({
  submissionId,
  workflowStep,
  ...(stepTokenHash ? { stepTokenHash } : {}),
})

const isSameMrfStepAuthContext = (
  a: MrfStepAuthContext,
  b: MrfStepAuthContext,
): boolean =>
  a.formId === b.formId &&
  a.submissionId === b.submissionId &&
  a.workflowStep === b.workflowStep &&
  a.authType === b.authType &&
  (a.stepTokenHash ?? '') === (b.stepTokenHash ?? '')

/**
 * Resolves who may fill in the pending step of an MRF submission from the
 * submission's saved workflow. The live form's login settings never apply to
 * a later step, and a protected step is never treated as unprotected.
 */
export const resolveMrfStepAuth = (
  formId: string,
  submission: IMultirespondentSubmissionSchema,
  credential: MrfStepCredential = {},
): Result<ResolvedMrfStepAuth, ResolveMrfStepAuthError> => {
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

  const step = workflow[workflowStep]
  const resolved: ResolvedMrfStepAuth = {
    workflowStep,
    workflowStepId: String(step._id),
    stepFields: getStepFields(
      (submission.form_fields ?? []) as FormFieldDto[],
      workflow,
      workflowStep,
    ),
  }
  if (!step.auth) {
    // A binding always names a login step, so this step has since changed.
    return 'binding' in credential
      ? err(new StepTokenVerificationError())
      : ok(resolved)
  }

  const context: MrfStepAuthContext = {
    formId,
    submissionId,
    workflowStep,
    authType: step.auth.auth_type,
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
  const loginStep = { ...resolved, context, esrvcId: step.auth.esrvc_id }
  if ('stepAuthCookies' in credential) {
    return verifyMrfStepAuthCookie(credential.stepAuthCookies, context).map(
      (session) => ({ ...loginStep, session }),
    )
  }
  return ok(loginStep)
}

/**
 * The authenticated value a login identity field records, if any. MyInfo
 * NRIC/FIN is the session's uinFin; the Corppass UEN is its userName and the
 * representative UID its userInfo.
 */
export const getLoginIdentityValue = (
  field: SourceField,
  session: StepLoginIdentity,
): string | undefined => {
  const attr = getLoginIdentityAttr(field)
  if (
    !attr ||
    !getLoginIdentityAttrsForAuthType(session.authType).includes(attr)
  ) {
    return undefined
  }
  if (session.authType === FormAuthType.MyInfo) {
    return session.uinFin
  }
  return attr === CorppassAttribute.Uid ? session.userInfo : session.userName
}

/** A step's login identity fields, filled from its login and read-only. */
export const prefillLoginIdentityFields = (
  stepFields: FormFieldDto[],
  session: StepLoginIdentity,
): (FormFieldDto & { fieldValue: string })[] =>
  stepFields.flatMap((field) => {
    const fieldValue = getLoginIdentityValue(field, session)
    return fieldValue === undefined
      ? []
      : [{ ...field, fieldValue, disabled: true }]
  })

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
  // In dev the API (callbacks) and the Vite app run on different origins, and
  // the submission key lives in the app origin's sessionStorage.
  const origin =
    process.env.NODE_ENV === Environment.Dev ? config.app.feAppUrl : ''
  const base = `${origin}/${formId}/edit/${submissionId}`
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
    ...(session.stepTokenHash ? { stepTokenHash: session.stepTokenHash } : {}),
    ...(session.authType === FormAuthType.CP
      ? {
          authType: session.authType,
          userName: session.userName,
          userInfo: session.userInfo,
        }
      : {
          authType: session.authType,
          uinFin: session.uinFin,
          myInfoAuthSessionId: session.myInfoAuthSessionId,
        }),
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

/** Clears the continuation cookie for one submission, whichever provider set it. */
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
  )().andThen((decoded) => {
    const parsed = VerifiedMrfStepAuthSchema.safeParse(decoded)
    return parsed.success && isSameMrfStepAuthContext(parsed.data, expected)
      ? ok(parsed.data)
      : err(new InvalidJwtError())
  })
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
      const parsed = CpStepBindingSchema.safeParse(decoded)
      if (!parsed.success) {
        return err(new InvalidJwtError())
      }
      const { nonce: boundNonce, ...context } = parsed.data
      return boundNonce === nonce
        ? ok<MrfStepAuthContext, unknown>(context)
        : err(new InvalidJwtError())
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
