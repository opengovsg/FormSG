import crypto from 'crypto'
import { Document, Model, Mongoose, Schema } from 'mongoose'

import { MYINFO_FAPI_SESSION_MAX_AGE_MS } from './myinfo.fapi.constants'
import {
  decrypt,
  decryptJwk,
  encrypt,
  encryptJwk,
} from './myinfo.fapi.session.crypto'

export const MYINFO_FAPI_SESSION_SCHEMA_ID = 'MyInfoFapiSession'

/**
 * pending -> exchanged or pending -> failed, exactly once. Transitions filter
 * on phase so Mongo, not a read-then-write race, picks the winner between
 * concurrent callbacks. `pending` means the Singpass callback hasn't landed.
 */
export type MyInfoFapiSessionPhase = 'pending' | 'exchanged' | 'failed'

/**
 * Binds a login to a later MRF step. formId is already stored on the session;
 * the step index refers to the submission's saved workflow.
 */
export interface MyInfoMrfSessionContext {
  submissionId: string
  workflowStep: number
  stepTokenHash?: string
}

export interface IMyInfoFapiSessionSchema extends Document<string> {
  _id: string
  phase: MyInfoFapiSessionPhase
  formId: string
  mrfContext?: MyInfoMrfSessionContext
  encodedQuery?: string
  state: string
  nonce: string
  codeVerifier: string
  dpopPrivateJwkEnc: string
  accessTokenEnc?: string
  sub?: string
  expireAt: Date
}

export type MyInfoFapiRedirectTarget = {
  formId: string
  mrfContext?: MyInfoMrfSessionContext
  encodedQuery?: string
}

export type MyInfoFapiPendingSession = MyInfoFapiRedirectTarget & {
  state: string
  nonce: string
  codeVerifier: string
  dpopPrivateJwk: JsonWebKey
}

export type MyInfoFapiExchangeSession = Pick<
  MyInfoFapiPendingSession,
  'formId' | 'state' | 'nonce' | 'codeVerifier' | 'dpopPrivateJwk'
>

/**
 * Exchange material exists on the pending variant only, so a callback can't
 * reach it once another has already exchanged.
 */
export type MyInfoFapiCallbackSession =
  | {
      phase: 'pending'
      target: MyInfoFapiRedirectTarget
      exchange: MyInfoFapiExchangeSession
    }
  | { phase: 'exchanged'; target: MyInfoFapiRedirectTarget }

export type MyInfoFapiExchangedSession = {
  formId: string
  accessToken: string
  /** Pseudonymous subject from the ID token, asserted against userinfo. */
  sub: string
  dpopPrivateJwk: JsonWebKey
}

/** `alreadyExchanged` is a legitimate duplicate callback, not an error. */
export type MyInfoFapiClaimOutcome = 'claimed' | 'alreadyExchanged' | 'notFound'

/**
 * `incomplete` covers a `pending` session or one already gone (TTL/unknown
 * id). `failed` is reported without deleting: a losing duplicate callback may
 * still be raced by the winner.
 */
export type MyInfoFapiConsumeOutcome =
  | { status: 'exchanged'; session: MyInfoFapiExchangedSession }
  | { status: 'failed' }
  | { status: 'incomplete' }
  // The session exists but belongs to another form or MRF step
  | { status: 'formMismatch' }

export interface IMyInfoFapiSessionModel extends Model<IMyInfoFapiSessionSchema> {
  createPending(session: MyInfoFapiPendingSession): Promise<string>
  loadForCallback(sessionId: string): Promise<MyInfoFapiCallbackSession | null>
  markExchanged(
    sessionId: string,
    tokens: { accessToken: string; sub: string },
  ): Promise<MyInfoFapiClaimOutcome>
  markFailed(sessionId: string): Promise<void>
  consume(args: {
    sessionId: string
    formId: string
    mrfContext?: MyInfoMrfSessionContext
  }): Promise<MyInfoFapiConsumeOutcome>
  isBoundToSubmission(args: {
    sessionId: string
    formId: string
    submissionId: string
  }): Promise<boolean>
}

/**
 * A session started for a later MRF step only matches that exact step. A
 * form-level consume only matches sessions started without a step.
 */
const contextFilter = (mrfContext?: MyInfoMrfSessionContext) =>
  mrfContext
    ? {
        'mrfContext.submissionId': mrfContext.submissionId,
        'mrfContext.workflowStep': mrfContext.workflowStep,
        'mrfContext.stepTokenHash': mrfContext.stepTokenHash ?? {
          $exists: false,
        },
      }
    : { mrfContext: { $exists: false } }

const requiredString = { type: String, required: true }
const optionalString = { type: String }

const MyInfoFapiSessionSchema = new Schema<
  IMyInfoFapiSessionSchema,
  IMyInfoFapiSessionModel
>(
  {
    // Opaque session ID, high entropy UUID to retrieve session data from MongoDB.
    _id: { type: String, default: () => crypto.randomUUID() },
    phase: { ...requiredString, enum: ['pending', 'exchanged', 'failed'] },
    formId: requiredString,
    mrfContext: {
      type: new Schema<MyInfoMrfSessionContext>(
        {
          submissionId: requiredString,
          workflowStep: { type: Number, required: true, min: 0 },
          stepTokenHash: optionalString,
        },
        { _id: false },
      ),
      required: false,
    },
    encodedQuery: optionalString,
    state: requiredString,
    nonce: requiredString,
    codeVerifier: requiredString,
    dpopPrivateJwkEnc: requiredString,
    accessTokenEnc: optionalString,
    sub: optionalString,
    expireAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: 'created', updatedAt: false } },
)

MyInfoFapiSessionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

MyInfoFapiSessionSchema.statics.createPending = async function (
  session: MyInfoFapiPendingSession,
): Promise<string> {
  const created = await this.create({
    phase: 'pending',
    formId: session.formId,
    ...(session.mrfContext ? { mrfContext: session.mrfContext } : {}),
    encodedQuery: session.encodedQuery,
    state: session.state,
    nonce: session.nonce,
    codeVerifier: session.codeVerifier,
    dpopPrivateJwkEnc: await encryptJwk(session.dpopPrivateJwk),
    expireAt: new Date(Date.now() + MYINFO_FAPI_SESSION_MAX_AGE_MS),
  })
  return created._id
}

/**
 * Omits secrets for an exchanged session so a duplicate callback only
 * redirects; pending/failed still return exchange material so a replay can
 * succeed.
 */
MyInfoFapiSessionSchema.statics.loadForCallback = async function (
  sessionId: string,
): Promise<MyInfoFapiCallbackSession | null> {
  const session = await this.findOne({ _id: sessionId })
  if (!session) {
    return null
  }

  const target: MyInfoFapiRedirectTarget = {
    formId: session.formId,
    ...(session.mrfContext
      ? {
          mrfContext: {
            submissionId: session.mrfContext.submissionId,
            workflowStep: session.mrfContext.workflowStep,
            ...(session.mrfContext.stepTokenHash
              ? { stepTokenHash: session.mrfContext.stepTokenHash }
              : {}),
          },
        }
      : {}),
    encodedQuery: session.encodedQuery,
  }
  if (session.phase === 'exchanged') {
    return { phase: 'exchanged', target }
  }

  return {
    phase: 'pending',
    target,
    exchange: {
      formId: session.formId,
      state: session.state,
      nonce: session.nonce,
      codeVerifier: session.codeVerifier,
      dpopPrivateJwk: await decryptJwk(session.dpopPrivateJwkEnc),
    },
  }
}

/**
 * Filters on `phase !== 'exchanged'`, not `pending`, so a session already
 * marked `failed` by a losing duplicate callback can still be claimed by the
 * winner.
 */
MyInfoFapiSessionSchema.statics.markExchanged = async function (
  sessionId: string,
  tokens: { accessToken: string; sub: string },
): Promise<MyInfoFapiClaimOutcome> {
  const claimed = await this.findOneAndUpdate(
    { _id: sessionId, phase: { $ne: 'exchanged' } },
    {
      $set: {
        phase: 'exchanged',
        accessTokenEnc: await encrypt(tokens.accessToken),
        sub: tokens.sub,
      },
    },
    // Otherwise Mongoose 7 types `claimed` as always truthy (ModifyResult overload).
    { includeResultMetadata: false },
  )
  if (claimed) {
    return 'claimed'
  }

  // Lost the claim: a duplicate callback still has a document; an expired
  // session does not.
  const stillPresent = await this.exists({ _id: sessionId })
  if (stillPresent) {
    return 'alreadyExchanged'
  }
  return 'notFound'
}

/**
 * Filtered on `phase: 'pending'` so an already-exchanged session isn't
 * overwritten with a failure.
 */
MyInfoFapiSessionSchema.statics.markFailed = async function (
  sessionId: string,
): Promise<void> {
  await this.findOneAndUpdate(
    { _id: sessionId, phase: 'pending' },
    { $set: { phase: 'failed' } },
  )
}

/**
 * Only for the form and login context that started the session. Deletes on
 * `exchanged` (single-use tokens); leaves `failed` in place since the winner
 * may still claim it. A mismatched session is left for its own tab.
 */
MyInfoFapiSessionSchema.statics.consume = async function ({
  sessionId,
  formId,
  mrfContext,
}: {
  sessionId: string
  formId: string
  mrfContext?: MyInfoMrfSessionContext
}): Promise<MyInfoFapiConsumeOutcome> {
  const filter = { _id: sessionId, formId, ...contextFilter(mrfContext) }
  const session = await this.findOne(filter)
  if (!session) {
    const belongsElsewhere = await this.exists({ _id: sessionId })
    if (belongsElsewhere) {
      return { status: 'formMismatch' }
    }
    return { status: 'incomplete' }
  }
  if (session.phase === 'pending') {
    return { status: 'incomplete' }
  }
  if (session.phase === 'failed') {
    return { status: 'failed' }
  }

  const exchanged = await this.findOneAndDelete(
    { ...filter, phase: 'exchanged' },
    { includeResultMetadata: false },
  )
  if (!exchanged || !exchanged.accessTokenEnc || !exchanged.sub) {
    return { status: exchanged ? 'failed' : 'incomplete' }
  }
  return {
    status: 'exchanged',
    session: {
      formId: exchanged.formId,
      accessToken: await decrypt(exchanged.accessTokenEnc),
      sub: exchanged.sub,
      dpopPrivateJwk: await decryptJwk(exchanged.dpopPrivateJwkEnc),
    },
  }
}

/** Whether logging out of one submission should discard this session. */
MyInfoFapiSessionSchema.statics.isBoundToSubmission = async function ({
  sessionId,
  formId,
  submissionId,
}: {
  sessionId: string
  formId: string
  submissionId: string
}): Promise<boolean> {
  const bound = await this.exists({
    _id: sessionId,
    formId,
    'mrfContext.submissionId': submissionId,
  })
  return !!bound
}

const getMyInfoFapiSessionModel = (db: Mongoose): IMyInfoFapiSessionModel => {
  try {
    return db.model(
      MYINFO_FAPI_SESSION_SCHEMA_ID,
    ) as unknown as IMyInfoFapiSessionModel
  } catch {
    return db.model<IMyInfoFapiSessionSchema, IMyInfoFapiSessionModel>(
      MYINFO_FAPI_SESSION_SCHEMA_ID,
      MyInfoFapiSessionSchema,
    )
  }
}

export default getMyInfoFapiSessionModel
