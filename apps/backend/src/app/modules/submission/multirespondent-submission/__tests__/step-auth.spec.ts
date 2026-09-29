import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import {
  FormAuthType,
  FormFieldDto,
  WorkflowStatus,
  WorkflowType,
} from 'formsg-shared/types'
import jwt from 'jsonwebtoken'
import { omit } from 'lodash'

import {
  IMultirespondentSubmissionSchema,
  IPopulatedMultirespondentForm,
} from 'src/types'

import {
  AuthTypeMismatchError,
  FormAuthNoEsrvcIdError,
  FormWhitelistSettingNotFoundError,
} from '../../../form/form.errors'
import {
  InvalidJwtError,
  MissingJwtError,
  VerifyJwtError,
} from '../../../spcp/spcp.errors'
import {
  MrfSubmissionStaleError,
  StepTokenVerificationError,
  SubmissionNotFoundError,
} from '../../submission.errors'
import {
  CpStepBindingExpiredError,
  getMrfContinuationDestination,
  getMrfStepAuthCookieName,
  resolveMrfStepAuth,
  setCpStepBindingCookie,
  setMrfStepAuthCookie,
  verifyCpStepBinding,
  verifyMrfStepAuthCookie,
} from '../step-auth'
import type { MrfStepAuthContext } from '../step-auth.types'
import * as stepToken from '../step-token'

jest.mock('../../../spcp/spcp.oidc.service', () => ({
  getOidcService: () => ({
    getCookieDuration: () => 60 * 60 * 1000,
    getCookieSettings: () => ({ domain: 'form.gov.sg', path: '/' }),
    getCodeVerifierCookieOptions: () => ({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    }),
  }),
}))

const FORM_ID = new ObjectId().toHexString()
const SUBMISSION_ID = new ObjectId().toHexString()
const STEP_TOKEN = stepToken.generate()
const WHITELIST_ID = new ObjectId()

const STEP_1_FIELD = { _id: new ObjectId().toHexString(), title: 'Request' }
const STEP_2_FIELD = { _id: new ObjectId().toHexString(), title: 'Name' }

const MOCK_FORM = {
  _id: FORM_ID,
  // The live form has since changed its login; later steps must ignore it.
  authType: FormAuthType.SP,
  esrvcId: 'live-esrvc-id',
} as unknown as IPopulatedMultirespondentForm

const makeSubmission = (
  overrides: Partial<IMultirespondentSubmissionSchema> = {},
  step2Auth: unknown = {
    auth_type: FormAuthType.CP,
    is_submitter_id_collection_enabled: true,
    whitelisted_submitter_ids: {
      isWhitelistEnabled: true,
      encryptedWhitelistedSubmitterIds: WHITELIST_ID,
    },
  },
) =>
  ({
    _id: SUBMISSION_ID,
    form: new ObjectId(FORM_ID),
    workflowStep: 0,
    stepTokenHash: stepToken.hash(STEP_TOKEN),
    esrvcId: 'snapshot-esrvc-id',
    form_fields: [STEP_1_FIELD, STEP_2_FIELD] as FormFieldDto[],
    workflow: [
      {
        workflow_type: WorkflowType.Static,
        emails: [],
        edit: [STEP_1_FIELD._id],
      },
      {
        workflow_type: WorkflowType.Static,
        emails: [],
        edit: [STEP_2_FIELD._id],
        ...(step2Auth ? { auth: step2Auth } : {}),
      },
    ],
    submittedSteps: [],
    ...overrides,
  }) as unknown as IMultirespondentSubmissionSchema

const CONTEXT: MrfStepAuthContext = {
  formId: FORM_ID,
  submissionId: SUBMISSION_ID,
  workflowStep: 1,
  stepTokenHash: stepToken.hash(STEP_TOKEN),
  authType: FormAuthType.CP,
}

describe('step-auth', () => {
  describe('resolveMrfStepAuth', () => {
    it("should resolve the pending step's login from the submission copy", () => {
      const result = resolveMrfStepAuth(MOCK_FORM, makeSubmission(), {
        stepToken: STEP_TOKEN,
      })

      expect(result._unsafeUnwrap()).toEqual({
        workflowStep: 1,
        stepFields: [STEP_2_FIELD],
        context: CONTEXT,
        login: {
          authType: FormAuthType.CP,
          isSubmitterIdCollectionEnabled: true,
          whitelist: {
            isWhitelistEnabled: true,
            whitelistId: String(WHITELIST_ID),
          },
          esrvcId: 'snapshot-esrvc-id',
        },
      })
    })

    it('should treat a step saved without login as having no login', () => {
      const result = resolveMrfStepAuth(MOCK_FORM, makeSubmission({}, null), {
        stepToken: STEP_TOKEN,
      })

      expect(result._unsafeUnwrap()).toEqual({
        workflowStep: 1,
        stepFields: [STEP_2_FIELD],
      })
    })

    it.each([
      ['missing', undefined],
      ['wrong', stepToken.generate()],
    ])('should reject a %s step token', (_, presented) => {
      const result = resolveMrfStepAuth(MOCK_FORM, makeSubmission(), {
        stepToken: presented,
      })

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        StepTokenVerificationError,
      )
    })

    it('should allow a legacy submission without a step token', () => {
      const result = resolveMrfStepAuth(
        MOCK_FORM,
        makeSubmission({ stepTokenHash: undefined }),
      )

      expect(result._unsafeUnwrap().context).toEqual(
        omit(CONTEXT, 'stepTokenHash'),
      )
    })

    it('should reject a submission of another form', () => {
      const result = resolveMrfStepAuth(
        MOCK_FORM,
        makeSubmission({ form: new ObjectId() }),
        { stepToken: STEP_TOKEN },
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(SubmissionNotFoundError)
    })

    it('should reject a completed workflow instead of treating it as no login', () => {
      const result = resolveMrfStepAuth(
        MOCK_FORM,
        makeSubmission({ workflowStep: 1 }),
        { stepToken: STEP_TOKEN },
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfSubmissionStaleError)
    })

    it('should reject a rejected workflow', () => {
      const result = resolveMrfStepAuth(
        MOCK_FORM,
        makeSubmission({
          submittedSteps: [
            {
              isApproval: true,
              status: WorkflowStatus.REJECTED,
              submittedAt: new Date().toISOString(),
            },
          ],
        }),
        { stepToken: STEP_TOKEN },
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MrfSubmissionStaleError)
    })

    it('should fail closed for a Corppass step without a saved e-service ID', () => {
      const result = resolveMrfStepAuth(
        MOCK_FORM,
        makeSubmission({ esrvcId: undefined }),
        { stepToken: STEP_TOKEN },
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(FormAuthNoEsrvcIdError)
    })

    it('should fail closed for an enabled list without its record', () => {
      const result = resolveMrfStepAuth(
        MOCK_FORM,
        makeSubmission(
          {},
          {
            auth_type: FormAuthType.MyInfo,
            is_submitter_id_collection_enabled: false,
            whitelisted_submitter_ids: { isWhitelistEnabled: true },
          },
        ),
        { stepToken: STEP_TOKEN },
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        FormWhitelistSettingNotFoundError,
      )
    })

    it('should fail closed for an unknown saved provider', () => {
      const result = resolveMrfStepAuth(
        MOCK_FORM,
        makeSubmission(
          {},
          {
            auth_type: FormAuthType.SGID,
            is_submitter_id_collection_enabled: false,
          },
        ),
        { stepToken: STEP_TOKEN },
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(AuthTypeMismatchError)
    })

    it('should accept a binding that still matches the pending step', () => {
      const result = resolveMrfStepAuth(MOCK_FORM, makeSubmission(), {
        binding: CONTEXT,
      })

      expect(result._unsafeUnwrap().context).toEqual(CONTEXT)
    })

    it.each([
      ['the step token changed', { stepTokenHash: 'another-hash' }],
      ['the step advanced', { workflowStep: 2 }],
      [
        'it names another submission',
        { submissionId: new ObjectId().toHexString() },
      ],
      ['it names another provider', { authType: FormAuthType.MyInfo }],
    ] as const)(
      'should reject a binding when %s',
      (_, change: Partial<MrfStepAuthContext>) => {
        const result = resolveMrfStepAuth(MOCK_FORM, makeSubmission(), {
          binding: { ...CONTEXT, ...change },
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          StepTokenVerificationError,
        )
      },
    )
  })

  describe('continuation cookie', () => {
    const MYINFO_SESSION = {
      ...CONTEXT,
      authType: FormAuthType.MyInfo as const,
      userName: 'S1234567D',
      myInfoAuthSessionId: 'fapi-session-id',
    }
    const mintCookie = (session = MYINFO_SESSION) => {
      const res = expressHandler.mockResponse()
      setMrfStepAuthCookie(res, session)
      const [name, token, options] = jest.mocked(res.cookie).mock
        .calls[0] as unknown[]
      return { name: name as string, token: token as string, options }
    }

    it('should be scoped to one submission and the form API path', () => {
      const { name, options } = mintCookie()

      expect(name).toBe(`mrfStepAuth_${FORM_ID}_${SUBMISSION_ID}`)
      expect(options).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        path: `/api/v3/forms/${FORM_ID}`,
      })
    })

    it('should verify for the same step and return the identity', () => {
      const { name, token } = mintCookie()

      const result = verifyMrfStepAuthCookie(
        { [name]: token },
        { ...CONTEXT, authType: FormAuthType.MyInfo },
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        userName: 'S1234567D',
        myInfoAuthSessionId: 'fapi-session-id',
      })
    })

    it.each([
      ['step', { workflowStep: 2 }],
      ['step token', { stepTokenHash: 'another-hash' }],
      ['provider', { authType: FormAuthType.CP }],
    ] as const)(
      'should not unlock another %s',
      (_, change: Partial<MrfStepAuthContext>) => {
        const { name, token } = mintCookie()

        const result = verifyMrfStepAuthCookie(
          { [name]: token },
          { ...CONTEXT, authType: FormAuthType.MyInfo, ...change },
        )

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidJwtError)
      },
    )

    it('should not unlock another submission', () => {
      const { token } = mintCookie()
      const otherContext: MrfStepAuthContext = {
        ...CONTEXT,
        authType: FormAuthType.MyInfo,
        submissionId: new ObjectId().toHexString(),
      }

      // Even when replayed under the other submission's cookie name
      const result = verifyMrfStepAuthCookie(
        { [getMrfStepAuthCookieName(otherContext)]: token },
        otherContext,
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidJwtError)
    })

    it('should report a missing login separately from a bad cookie', () => {
      const result = verifyMrfStepAuthCookie({}, CONTEXT)

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(MissingJwtError)
    })

    it('should reject a cookie signed with the plain session secret', () => {
      const forged = jwt.sign(
        { ...MYINFO_SESSION },
        process.env.SESSION_SECRET as string,
        { audience: 'mrf-step-auth', expiresIn: 60 },
      )

      const result = verifyMrfStepAuthCookie(
        { [getMrfStepAuthCookieName(CONTEXT)]: forged },
        { ...CONTEXT, authType: FormAuthType.MyInfo },
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(VerifyJwtError)
    })

    it('should reject a MyInfo login without its hash session', () => {
      const { name, token } = mintCookie({
        ...MYINFO_SESSION,
        myInfoAuthSessionId: '',
      })

      const result = verifyMrfStepAuthCookie(
        { [name]: token },
        { ...CONTEXT, authType: FormAuthType.MyInfo },
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidJwtError)
    })

    it('should reject an expired cookie', () => {
      jest.useFakeTimers({ now: Date.now() })
      const { name, token } = mintCookie()
      jest.setSystemTime(Date.now() + 365 * 24 * 60 * 60 * 1000)

      const result = verifyMrfStepAuthCookie(
        { [name]: token },
        { ...CONTEXT, authType: FormAuthType.MyInfo },
      )

      jest.useRealTimers()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(VerifyJwtError)
    })
  })

  describe('Corppass step binding', () => {
    const NONCE = 'a'.repeat(32)
    const mintBinding = () => {
      const res = expressHandler.mockResponse()
      setCpStepBindingCookie(res, CONTEXT, NONCE)
      const [name, token, options] = jest.mocked(res.cookie).mock
        .calls[0] as unknown[]
      return { name, token: token as string, options }
    }

    it('should expire after five minutes', () => {
      const { name, options } = mintBinding()

      expect(name).toBe(`cpStepBinding_${NONCE}`)
      expect(options).toMatchObject({ maxAge: 5 * 60 * 1000, sameSite: 'lax' })
    })

    it('should verify against the nonce in the callback state', () => {
      const { token } = mintBinding()

      expect(verifyCpStepBinding(token, NONCE)._unsafeUnwrap()).toEqual(CONTEXT)
      expect(
        verifyCpStepBinding(token, 'b'.repeat(32))._unsafeUnwrapErr(),
      ).toBeInstanceOf(InvalidJwtError)
    })

    it('should not accept a continuation cookie as a binding', () => {
      const res = expressHandler.mockResponse()
      setMrfStepAuthCookie(res, {
        ...CONTEXT,
        userName: 'UEN',
        userInfo: 'UID',
      })
      const token = jest.mocked(res.cookie).mock.calls[0][1] as string

      expect(
        verifyCpStepBinding(token, NONCE)._unsafeUnwrapErr(),
      ).toBeInstanceOf(InvalidJwtError)
    })

    it('should report an expired binding with its context', () => {
      jest.useFakeTimers({ now: Date.now() })
      const { token } = mintBinding()
      jest.setSystemTime(Date.now() + 6 * 60 * 1000)

      const error = verifyCpStepBinding(token, NONCE)._unsafeUnwrapErr()

      jest.useRealTimers()
      expect(error).toBeInstanceOf(CpStepBindingExpiredError)
      expect((error as CpStepBindingExpiredError).context).toEqual(CONTEXT)
    })
  })

  describe('getMrfContinuationDestination', () => {
    it('should return to the edit page with only the prefill query ID', () => {
      expect(
        getMrfContinuationDestination({
          formId: FORM_ID,
          submissionId: SUBMISSION_ID,
          query: 'queryId=abc123&key=secret&token=secret',
        }),
      ).toBe(`/${FORM_ID}/edit/${SUBMISSION_ID}?queryId=abc123`)
    })

    it('should drop a malformed query ID', () => {
      expect(
        getMrfContinuationDestination({
          formId: FORM_ID,
          submissionId: SUBMISSION_ID,
          query: 'queryId=//evil.example',
        }),
      ).toBe(`/${FORM_ID}/edit/${SUBMISSION_ID}`)
    })
  })
})
