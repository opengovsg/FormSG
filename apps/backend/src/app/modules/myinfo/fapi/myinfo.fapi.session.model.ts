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

export interface IMyInfoFapiSessionSchema extends Document<string> {
  _id: string
  phase: MyInfoFapiSessionPhase
  formId: string
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
  }): Promise<MyInfoFapiConsumeOutcome>
}

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

  const target = {
    formId: session.formId,
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
 * Only for the form that started the session. Deletes on `exchanged`
 * (single-use tokens); leaves `failed` in place since the winner may still
 * claim it.
 */
MyInfoFapiSessionSchema.statics.consume = async function ({
  sessionId,
  formId,
}: {
  sessionId: string
  formId: string
}): Promise<MyInfoFapiConsumeOutcome> {
  const session = await this.findOne({ _id: sessionId, formId })
  if (!session) {
    const belongsToAnotherForm = await this.exists({
      _id: sessionId,
      formId: { $ne: formId },
    })
    if (belongsToAnotherForm) {
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
    { _id: sessionId, formId, phase: 'exchanged' },
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
