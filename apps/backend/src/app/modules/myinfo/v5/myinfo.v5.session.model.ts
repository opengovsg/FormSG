/**
 * MongoDB-backed session store for a single v5 login round trip.
 *
 * Why a server-side store and not a cookie:
 * - DPoP needs the *private* JWK across two HTTP requests (redirect → callback).
 *   Putting a private EC key in a cookie is gross and brittle.
 * - FormSG runs multi-pod. A user's two requests can land on different pods,
 *   so the keypair must be retrievable from anywhere.
 *
 * Why a dedicated collection and not session middleware:
 * - These sessions are pre-authentication and short-lived (≤5 min). Mixing
 *   them with the authenticated user session would either bloat that store or
 *   require complex cleanup. A self-cleaning TTL collection keeps responsibility
 *   tight.
 *
 * Lifecycle:
 *   1. createRedirectURL → generate PKCE + DPoP keypair, save session, return
 *      sessionId.
 *   2. Cookie carrying sessionId follows the user to Singpass and back.
 *   3. Callback / form-view → load by sessionId, use codeVerifier + DPoP
 *      keypair, then deleteOne(). One-shot semantics — a session can't be
 *      reused for a replay.
 */

import crypto from 'crypto'
import { Mongoose, Schema } from 'mongoose'

const SCHEMA_ID = 'MyInfoV5Session'
const SESSION_TTL_MS = 5 * 60 * 1000

export interface IMyInfoV5Session {
  _id: string
  /** PKCE code verifier (RFC 7636) for the token exchange. */
  codeVerifier: string
  /**
   * AES-256-GCM-encrypted envelope holding the DPoP keypair's private JWK,
   * produced by `encryptJwkAtRest` with a key derived from `config.sessionSecret`.
   * Absent when DPoP is off. Storing the ciphertext (not the JWK directly)
   * means a DB-only compromise can't reuse the keypair within the 5-minute
   * session window.
   */
  dpopPrivateJwkEnc?: string
  /**
   * OIDC nonce we sent on the authorize request. The IdP echoes it back in
   * the ID token; we verify equality after token exchange to defeat token-
   * replay attempts.
   */
  nonce?: string
  expireAt: Date
}

export interface IMyInfoV5SessionModel {
  createSession(args: {
    codeVerifier: string
    dpopPrivateJwkEnc?: string
    nonce?: string
  }): Promise<IMyInfoV5Session>
  /** One-shot: returns the session and deletes it. */
  consumeSession(sessionId: string): Promise<IMyInfoV5Session | null>
}

type ModelInstance = import('mongoose').Model<IMyInfoV5Session> &
  IMyInfoV5SessionModel

const schema = new Schema<IMyInfoV5Session>(
  {
    _id: {
      type: String,
      required: true,
    },
    codeVerifier: { type: String, required: true },
    // Typed as String (the encrypted envelope) rather than Object/Mixed. This
    // keeps the column to a single shape and prevents tampered rows from
    // smuggling arbitrary JWK material into `jose.importJWK`.
    dpopPrivateJwkEnc: { type: String, required: false },
    nonce: { type: String, required: false },
    expireAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: 'created', updatedAt: false }, _id: false },
)

// TTL — Mongo deletes documents at most a minute after `expireAt`. Combined
// with `consumeSession` doing an explicit delete, sessions are gone the
// moment they're used.
schema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

schema.statics.createSession = async function (args: {
  codeVerifier: string
  dpopPrivateJwkEnc?: string
  nonce?: string
}): Promise<IMyInfoV5Session> {
  const sessionId = crypto.randomUUID()
  return this.create({
    _id: sessionId,
    codeVerifier: args.codeVerifier,
    dpopPrivateJwkEnc: args.dpopPrivateJwkEnc,
    nonce: args.nonce,
    expireAt: new Date(Date.now() + SESSION_TTL_MS),
  })
}

schema.statics.consumeSession = async function (
  sessionId: string,
): Promise<IMyInfoV5Session | null> {
  return this.findOneAndDelete({ _id: sessionId })
}

function compile(db: Mongoose): ModelInstance {
  return db.model<IMyInfoV5Session>(
    SCHEMA_ID,
    schema,
  ) as unknown as ModelInstance
}

export default function getMyInfoV5SessionModel(db: Mongoose): ModelInstance {
  try {
    return db.model(SCHEMA_ID) as unknown as ModelInstance
  } catch {
    return compile(db)
  }
}
