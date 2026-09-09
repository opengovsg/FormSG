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
 * A login session moves pending -> exchanged or pending -> failed exactly
 * once, then is deleted. All transitions filter on phase, so Mongo decides
 * which of two concurrent callbacks wins rather than a read-then-write race.
 * A session left `pending` (neither transition ever happened) means the
 * respondent never reached, or hasn't yet reached, the Singpass callback.
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
  subEnc?: string
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
 * The exchange material exists on the pending variant only, so a callback
 * cannot reach for it once someone else has already exchanged.
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

/**
 * `alreadyExchanged` is the legitimate duplicate-callback case and must not
 * be treated as an error.
 */
export type MyInfoFapiClaimOutcome = 'claimed' | 'alreadyExchanged' | 'notFound'

/**
 * `incomplete` is a session still `pending`, or already gone (TTL / unknown
 * id). It is not deleted, so a later callback can still succeed.
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
    subEnc: optionalString,
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
 * Load a session for a callback. For exchanged sessions, omit secrets so
 * duplicate callbacks only redirect. Anything else (pending, or failed by an
 * earlier duplicate callback) still returns the exchange material, so a
 * replay can go on to succeed.
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
 * Records a successful token exchange. Filtered on
 * `phase: { $ne: 'exchanged' }`, not on `pending`: a session already marked
 * `failed` by a losing duplicate callback (an RBI forwarding race or a double
 * click) must still be claimable by the request that actually succeeded.
 * An already-exchanged session is left alone and reported as such.
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
        subEnc: await encrypt(tokens.sub),
      },
    },
    // Mongoose 7 otherwise resolves to the ModifyResult overload, which types
    // `claimed` as always truthy even though the runtime returns the document.
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
 * Records that the callback was reached but the login did not succeed
 * (Singpass returned an error, or the token exchange failed). Filtered on
 * `phase: 'pending'` so a session someone else already exchanged is left
 * alone rather than being overwritten with a failure.
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
 * Consumes a resolved session only for the form that started it. A session
 * for another form, or one still pending, is left untouched.
 */
MyInfoFapiSessionSchema.statics.consume = async function ({
  sessionId,
  formId,
}: {
  sessionId: string
  formId: string
}): Promise<MyInfoFapiConsumeOutcome> {
  const session = await this.findOneAndDelete(
    {
      _id: sessionId,
      formId,
      phase: { $in: ['exchanged', 'failed'] },
    },
    { includeResultMetadata: false },
  )
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
  if (
    session.phase === 'failed' ||
    !session.accessTokenEnc ||
    !session.subEnc
  ) {
    return { status: 'failed' }
  }
  return {
    status: 'exchanged',
    session: {
      formId: session.formId,
      accessToken: await decrypt(session.accessTokenEnc),
      sub: await decrypt(session.subEnc),
      dpopPrivateJwk: await decryptJwk(session.dpopPrivateJwkEnc),
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
