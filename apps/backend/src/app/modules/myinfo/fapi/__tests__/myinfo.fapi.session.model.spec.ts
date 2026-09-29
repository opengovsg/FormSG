import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { FormAuthType } from 'formsg-shared/types'
import mongoose from 'mongoose'

import type { MrfStepAuthContext } from '../../../submission/multirespondent-submission/step-auth.types'
import getMyInfoFapiSessionModel, {
  MyInfoFapiPendingSession,
} from '../myinfo.fapi.session.model'

const MyInfoFapiSession = getMyInfoFapiSessionModel(mongoose)

const MOCK_FORM_ID = '5f8f4b8f8f8f8f8f8f8f8f8f'
const MOCK_ACCESS_TOKEN = 'mock-access-token'
const MOCK_SUB = 'mock-pseudonymous-sub'
const MOCK_DPOP_JWK = {
  kty: 'EC',
  crv: 'P-256',
  x: '_GoOHZCtu2jnlvhAzS-YN73u3v35aWKVEC5_RBldvaQ',
  y: 'DU9bmIEjkXcF7YNLuWFbOnyopt0Hm7bdy9qbUYAS6hE',
  d: 'BEK8L4CGxDh5b2vLYMLJdWWyM_qNPHl2Yb6wMOc1Vzw',
}

const pendingSession: MyInfoFapiPendingSession = {
  formId: MOCK_FORM_ID,
  encodedQuery: 'mock-encoded-query',
  state: 'mock-state',
  nonce: 'mock-nonce',
  codeVerifier: 'mock-code-verifier',
  dpopPrivateJwk: MOCK_DPOP_JWK,
}

const consume = (sessionId: string, formId = MOCK_FORM_ID) =>
  MyInfoFapiSession.consume({ sessionId, formId })

describe('myinfo.fapi.session.model', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('createPending and loadForCallback', () => {
    it('should round-trip the exchange material through encryption at rest', async () => {
      const sessionId = await MyInfoFapiSession.createPending(pendingSession)

      const loaded = await MyInfoFapiSession.loadForCallback(sessionId)

      expect(loaded).toEqual({
        phase: 'pending',
        target: { formId: MOCK_FORM_ID, encodedQuery: 'mock-encoded-query' },
        exchange: {
          formId: MOCK_FORM_ID,
          state: pendingSession.state,
          nonce: pendingSession.nonce,
          codeVerifier: pendingSession.codeVerifier,
          dpopPrivateJwk: pendingSession.dpopPrivateJwk,
        },
      })
    })

    it('should not persist the DPoP private key in plaintext', async () => {
      const sessionId = await MyInfoFapiSession.createPending(pendingSession)

      const raw = await mongoose.connection
        .collection('myinfofapisessions')
        .findOne({ _id: sessionId as unknown as mongoose.Types.ObjectId })

      expect(JSON.stringify(raw)).not.toContain(MOCK_DPOP_JWK.d)
      const envelope = String(raw?.dpopPrivateJwkEnc)
      expect(envelope.split('.')).toHaveLength(5)
      expect(
        JSON.parse(Buffer.from(envelope.split('.')[0], 'base64url').toString()),
      ).toMatchObject({ alg: 'dir', enc: 'A256GCM' })
    })

    it('should return null for an unknown session id', async () => {
      await expect(
        MyInfoFapiSession.loadForCallback('does-not-exist'),
      ).resolves.toBeNull()
    })
  })

  describe('markExchanged', () => {
    it('should pick exactly one winner among concurrent callbacks', async () => {
      const sessionId = await MyInfoFapiSession.createPending(pendingSession)

      const outcomes = await Promise.all([
        MyInfoFapiSession.markExchanged(sessionId, {
          accessToken: MOCK_ACCESS_TOKEN,
          sub: MOCK_SUB,
        }),
        MyInfoFapiSession.markExchanged(sessionId, {
          accessToken: 'a-second-token',
          sub: MOCK_SUB,
        }),
      ])

      expect(outcomes.sort()).toEqual(['alreadyExchanged', 'claimed'])
    })

    it('should report notFound when the session has expired away', async () => {
      await expect(
        MyInfoFapiSession.markExchanged('does-not-exist', {
          accessToken: MOCK_ACCESS_TOKEN,
          sub: MOCK_SUB,
        }),
      ).resolves.toBe('notFound')
    })

    it('should let a genuine exchange overwrite a failure recorded by the losing callback', async () => {
      const sessionId = await MyInfoFapiSession.createPending(pendingSession)
      await MyInfoFapiSession.markFailed(sessionId)

      await expect(
        MyInfoFapiSession.markExchanged(sessionId, {
          accessToken: MOCK_ACCESS_TOKEN,
          sub: MOCK_SUB,
        }),
      ).resolves.toBe('claimed')

      const consumed = await consume(sessionId)
      expect(consumed).toMatchObject({
        status: 'exchanged',
        session: { accessToken: MOCK_ACCESS_TOKEN, sub: MOCK_SUB },
      })
    })

    it('should offer the exchange material again while the session is failed', async () => {
      const sessionId = await MyInfoFapiSession.createPending(pendingSession)
      await MyInfoFapiSession.markFailed(sessionId)

      const loaded = await MyInfoFapiSession.loadForCallback(sessionId)

      expect(loaded).toMatchObject({ phase: 'pending' })
    })

    it('should withhold the exchange material from a later callback', async () => {
      const sessionId = await MyInfoFapiSession.createPending(pendingSession)
      await MyInfoFapiSession.markExchanged(sessionId, {
        accessToken: MOCK_ACCESS_TOKEN,
        sub: MOCK_SUB,
      })

      const loaded = await MyInfoFapiSession.loadForCallback(sessionId)

      expect(loaded).toEqual({
        phase: 'exchanged',
        target: { formId: MOCK_FORM_ID, encodedQuery: 'mock-encoded-query' },
      })
    })
  })

  describe('markFailed', () => {
    it('should be consumable as a failed session afterwards', async () => {
      const sessionId = await MyInfoFapiSession.createPending(pendingSession)

      await MyInfoFapiSession.markFailed(sessionId)

      await expect(consume(sessionId)).resolves.toEqual({
        status: 'failed',
      })
    })

    it('should not overwrite a session someone else already exchanged', async () => {
      const sessionId = await MyInfoFapiSession.createPending(pendingSession)
      await MyInfoFapiSession.markExchanged(sessionId, {
        accessToken: MOCK_ACCESS_TOKEN,
        sub: MOCK_SUB,
      })

      await MyInfoFapiSession.markFailed(sessionId)

      const loaded = await MyInfoFapiSession.loadForCallback(sessionId)
      expect(loaded).toMatchObject({ phase: 'exchanged' })
    })

    it('should be a no-op for an unknown session id', async () => {
      await expect(
        MyInfoFapiSession.markFailed('does-not-exist'),
      ).resolves.toBeUndefined()
    })
  })

  describe('consume', () => {
    const exchange = async () => {
      const sessionId = await MyInfoFapiSession.createPending(pendingSession)
      await MyInfoFapiSession.markExchanged(sessionId, {
        accessToken: MOCK_ACCESS_TOKEN,
        sub: MOCK_SUB,
      })
      return sessionId
    }

    it('should return the decrypted token and DPoP key for an exchanged session', async () => {
      const sessionId = await exchange()

      await expect(consume(sessionId)).resolves.toEqual({
        status: 'exchanged',
        session: {
          formId: MOCK_FORM_ID,
          accessToken: MOCK_ACCESS_TOKEN,
          sub: MOCK_SUB,
          dpopPrivateJwk: MOCK_DPOP_JWK,
        },
      })
    })

    it('should leave a session for another form untouched', async () => {
      const sessionId = await exchange()

      await expect(consume(sessionId, 'another-form-id')).resolves.toEqual({
        status: 'formMismatch',
      })
      await expect(consume(sessionId)).resolves.toMatchObject({
        status: 'exchanged',
      })
    })

    it('should be single-use', async () => {
      const sessionId = await exchange()
      await consume(sessionId)

      await expect(consume(sessionId)).resolves.toEqual({
        status: 'incomplete',
      })
    })

    it('should report failed without deleting, so a later callback can still claim', async () => {
      const sessionId = await MyInfoFapiSession.createPending(pendingSession)
      await MyInfoFapiSession.markFailed(sessionId)

      await expect(consume(sessionId)).resolves.toEqual({
        status: 'failed',
      })

      await expect(
        MyInfoFapiSession.markExchanged(sessionId, {
          accessToken: MOCK_ACCESS_TOKEN,
          sub: MOCK_SUB,
        }),
      ).resolves.toBe('claimed')

      await expect(consume(sessionId)).resolves.toMatchObject({
        status: 'exchanged',
        session: { accessToken: MOCK_ACCESS_TOKEN, sub: MOCK_SUB },
      })
    })

    it('should leave a pending session untouched', async () => {
      const sessionId = await MyInfoFapiSession.createPending(pendingSession)

      await expect(consume(sessionId)).resolves.toEqual({
        status: 'incomplete',
      })
      await expect(
        MyInfoFapiSession.loadForCallback(sessionId),
      ).resolves.not.toBeNull()
    })
  })

  describe('MRF step binding', () => {
    const exchange = async () => {
      const sessionId = await MyInfoFapiSession.createPending(pendingSession)
      await MyInfoFapiSession.markExchanged(sessionId, {
        accessToken: MOCK_ACCESS_TOKEN,
        sub: MOCK_SUB,
      })
      return sessionId
    }
    const mrfContext: MrfStepAuthContext = {
      formId: MOCK_FORM_ID,
      submissionId: '5f8f4b8f8f8f8f8f8f8f8f90',
      workflowStep: 1,
      stepTokenHash: 'mock-step-token-hash',
      authType: FormAuthType.MyInfo,
    }
    const exchangeBound = async (context = mrfContext) => {
      const sessionId = await MyInfoFapiSession.createPending({
        ...pendingSession,
        mrfContext: context,
      })
      await MyInfoFapiSession.markExchanged(sessionId, {
        accessToken: MOCK_ACCESS_TOKEN,
        sub: MOCK_SUB,
      })
      return sessionId
    }

    it('should return the binding to the callback so it can redirect to the step', async () => {
      const sessionId = await MyInfoFapiSession.createPending({
        ...pendingSession,
        mrfContext,
      })

      await expect(
        MyInfoFapiSession.loadForCallback(sessionId),
      ).resolves.toMatchObject({ target: { mrfContext } })
    })

    it('should not let a form-level load consume a step login, nor delete it', async () => {
      const sessionId = await exchangeBound()

      await expect(consume(sessionId)).resolves.toEqual({
        status: 'formMismatch',
      })
      await expect(
        MyInfoFapiSession.consume({
          sessionId,
          formId: MOCK_FORM_ID,
          mrfContext,
        }),
      ).resolves.toMatchObject({
        status: 'exchanged',
        session: { accessToken: MOCK_ACCESS_TOKEN },
      })
    })

    it('should not let a step load consume a form-level login', async () => {
      const sessionId = await exchange()

      await expect(
        MyInfoFapiSession.consume({
          sessionId,
          formId: MOCK_FORM_ID,
          mrfContext,
        }),
      ).resolves.toEqual({ status: 'formMismatch' })
      await expect(consume(sessionId)).resolves.toMatchObject({
        status: 'exchanged',
      })
    })

    it.each([
      ['submission', { submissionId: '5f8f4b8f8f8f8f8f8f8f8f91' }],
      ['step', { workflowStep: 2 }],
      ['step token', { stepTokenHash: 'another-step-token-hash' }],
      ['step without a token', { stepTokenHash: undefined }],
    ])(
      'should leave the session untouched for another %s',
      async (_, change) => {
        const sessionId = await exchangeBound()

        await expect(
          MyInfoFapiSession.consume({
            sessionId,
            formId: MOCK_FORM_ID,
            mrfContext: { ...mrfContext, ...change },
          }),
        ).resolves.toEqual({ status: 'formMismatch' })
        await expect(
          MyInfoFapiSession.consume({
            sessionId,
            formId: MOCK_FORM_ID,
            mrfContext,
          }),
        ).resolves.toMatchObject({ status: 'exchanged' })
      },
    )

    it('should match a legacy submission without a step token only when neither has one', async () => {
      const tokenless = { ...mrfContext, stepTokenHash: undefined }
      const sessionId = await exchangeBound(tokenless)

      await expect(
        MyInfoFapiSession.consume({
          sessionId,
          formId: MOCK_FORM_ID,
          mrfContext,
        }),
      ).resolves.toEqual({ status: 'formMismatch' })
      await expect(
        MyInfoFapiSession.consume({
          sessionId,
          formId: MOCK_FORM_ID,
          mrfContext: tokenless,
        }),
      ).resolves.toMatchObject({ status: 'exchanged' })
    })

    it('should report whether a session was started for a submission', async () => {
      const sessionId = await exchangeBound()
      const legacySessionId = await exchange()

      await expect(
        MyInfoFapiSession.isBoundToSubmission({
          sessionId,
          formId: MOCK_FORM_ID,
          submissionId: mrfContext.submissionId,
        }),
      ).resolves.toBe(true)
      await expect(
        MyInfoFapiSession.isBoundToSubmission({
          sessionId,
          formId: MOCK_FORM_ID,
          submissionId: '5f8f4b8f8f8f8f8f8f8f8f91',
        }),
      ).resolves.toBe(false)
      await expect(
        MyInfoFapiSession.isBoundToSubmission({
          sessionId: legacySessionId,
          formId: MOCK_FORM_ID,
          submissionId: mrfContext.submissionId,
        }),
      ).resolves.toBe(false)
    })
  })

  describe('indexes', () => {
    it('should expire sessions via a TTL index on expireAt', async () => {
      await MyInfoFapiSession.createPending(pendingSession)
      await MyInfoFapiSession.syncIndexes()

      const indexes = await MyInfoFapiSession.collection.indexes()

      expect(indexes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: { expireAt: 1 },
            expireAfterSeconds: 0,
          }),
        ]),
      )
    })
  })
})
