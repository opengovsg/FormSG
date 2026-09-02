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
 * A login session moves pending -> exchanged exactly once, then is deleted.
 * Both transitions filter on phase, so Mongo decides which of two concurrent
 * callbacks wins rather than a read-then-write race.
 */
export type MyInfoFapiSessionPhase = 'pending' | 'exchanged'

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

/**
 * The exchange material exists on the pending variant only, so a callback
 * cannot reach for it once someone else has already exchanged.
 */
export type MyInfoFapiCallbackSession =
  | {
      phase: 'pending'
      target: MyInfoFapiRedirectTarget
      exchange: MyInfoFapiPendingSession
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

export interface IMyInfoFapiSessionModel extends Model<IMyInfoFapiSessionSchema> {
  createPending(session: MyInfoFapiPendingSession): Promise<string>
  loadForCallback(sessionId: string): Promise<MyInfoFapiCallbackSession | null>
  markExchanged(
    sessionId: string,
    tokens: { accessToken: string; sub: string },
  ): Promise<MyInfoFapiClaimOutcome>
  consumeExchanged(
    sessionId: string,
  ): Promise<MyInfoFapiExchangedSession | null>
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
    phase: { ...requiredString, enum: ['pending', 'exchanged'] },
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
      encodedQuery: session.encodedQuery,
      state: session.state,
      nonce: session.nonce,
      codeVerifier: session.codeVerifier,
      dpopPrivateJwk: await decryptJwk(session.dpopPrivateJwkEnc),
    },
  }
}

MyInfoFapiSessionSchema.statics.markExchanged = async function (
  sessionId: string,
  tokens: { accessToken: string; sub: string },
): Promise<MyInfoFapiClaimOutcome> {
  const claimed = await this.findOneAndUpdate(
    { _id: sessionId, phase: 'pending' },
    {
      $set: {
        phase: 'exchanged',
        accessTokenEnc: await encrypt(tokens.accessToken),
        sub: tokens.sub,
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

MyInfoFapiSessionSchema.statics.consumeExchanged = async function (
  sessionId: string,
): Promise<MyInfoFapiExchangedSession | null> {
  const session = await this.findOneAndDelete(
    { _id: sessionId, phase: 'exchanged' },
    { includeResultMetadata: false },
  )
  if (!session || !session.accessTokenEnc || !session.sub) {
    return null
  }

  return {
    formId: session.formId,
    accessToken: await decrypt(session.accessTokenEnc),
    sub: session.sub,
    dpopPrivateJwk: await decryptJwk(session.dpopPrivateJwkEnc),
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
