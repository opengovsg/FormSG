import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import {
  BasicField,
  FormAuthType,
  FormFieldDto,
  WorkflowStatus,
  WorkflowType,
} from 'formsg-shared/types'
import jwt from 'jsonwebtoken'
import { omit } from 'lodash'

import { IMultirespondentSubmissionSchema } from 'src/types'

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
  getLoginIdentityValue,
  getMrfContinuationDestination,
  getMrfStepAuthCookieName,
  getMrfStepLoginSubmissionId,
  MrfStepAuthContext,
  prefillLoginIdentityFields,
  resolveMrfStepAuth,
  setCpStepBindingCookie,
  setMrfStepAuthCookie,
  verifyCpStepBinding,
  verifyMrfStepAuthCookie,
  withMrfStepLoginMarker,
} from '../step-auth'
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
const STEP_2_ID = new ObjectId().toHexString()
const STEP_TOKEN = stepToken.generate()

const STEP_1_FIELD = { _id: new ObjectId().toHexString(), title: 'Request' }
const UEN_FIELD = {
  _id: new ObjectId().toHexString(),
  title: 'Entity UEN',
  fieldType: BasicField.Uen,
  corppass: { attr: 'uen' },
}
const UID_FIELD = {
  _id: new ObjectId().toHexString(),
  title: 'Representative ID',
  fieldType: BasicField.Nric,
  corppass: { attr: 'uid' },
}

const makeSubmission = (
  overrides: Partial<IMultirespondentSubmissionSchema> = {},
  step2Auth: unknown = { auth_type: FormAuthType.CP },
) =>
  ({
    _id: SUBMISSION_ID,
    form: new ObjectId(FORM_ID),
    workflowStep: 0,
    stepTokenHash: stepToken.hash(STEP_TOKEN),
    form_fields: [STEP_1_FIELD, UEN_FIELD] as FormFieldDto[],
    workflow: [
      {
        workflow_type: WorkflowType.Static,
        emails: [],
        edit: [STEP_1_FIELD._id],
      },
      {
        _id: STEP_2_ID,
        workflow_type: WorkflowType.Static,
        emails: [],
        edit: [UEN_FIELD._id],
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
    it("resolves the pending step's login from the submission snapshot", () => {
      const result = resolveMrfStepAuth(FORM_ID, makeSubmission(), {
        stepToken: STEP_TOKEN,
      })

      expect(result._unsafeUnwrap()).toEqual({
        workflowStep: 1,
        workflowStepId: STEP_2_ID,
        stepFields: [UEN_FIELD],
        context: CONTEXT,
      })
    })

    it('treats a step saved without login as having no login', () => {
      const result = resolveMrfStepAuth(FORM_ID, makeSubmission({}, null), {
        stepToken: STEP_TOKEN,
      })

      expect(result._unsafeUnwrap()).toEqual({
        workflowStep: 1,
        workflowStepId: STEP_2_ID,
        stepFields: [UEN_FIELD],
      })
    })

    it.each([
      ['missing', undefined],
      ['wrong', stepToken.generate()],
    ])('rejects a %s step token', (_, presented) => {
      const result = resolveMrfStepAuth(FORM_ID, makeSubmission(), {
        stepToken: presented,
      })

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        StepTokenVerificationError,
      )
    })

    it('allows an older submission without a step token', () => {
      const result = resolveMrfStepAuth(
        FORM_ID,
        makeSubmission({ stepTokenHash: undefined }),
      )

      expect(result._unsafeUnwrap().context).toEqual(
        omit(CONTEXT, 'stepTokenHash'),
      )
    })

    it('rejects a submission of another form', () => {
      const result = resolveMrfStepAuth(
        FORM_ID,
        makeSubmission({ form: new ObjectId() }),
        { stepToken: STEP_TOKEN },
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(SubmissionNotFoundError)
    })

    it.each([
      ['completed', { workflowStep: 1 }],
      [
        'rejected',
        {
          submittedSteps: [
            {
              isApproval: true,
              status: WorkflowStatus.REJECTED,
              submittedAt: new Date().toISOString(),
            },
          ],
        },
      ],
    ])(
      'rejects a %s workflow instead of treating it as no login',
      (_, overrides) => {
        const result = resolveMrfStepAuth(
          FORM_ID,
          makeSubmission(
            overrides as Partial<IMultirespondentSubmissionSchema>,
          ),
          { stepToken: STEP_TOKEN },
        )

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          MrfSubmissionStaleError,
        )
      },
    )

    it('accepts a binding that still matches the pending step', () => {
      const result = resolveMrfStepAuth(FORM_ID, makeSubmission(), {
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
      'rejects a binding when %s',
      (_, change: Partial<MrfStepAuthContext>) => {
        const result = resolveMrfStepAuth(FORM_ID, makeSubmission(), {
          binding: { ...CONTEXT, ...change },
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          StepTokenVerificationError,
        )
      },
    )

    it('rejects a binding once the step no longer has login', () => {
      const result = resolveMrfStepAuth(FORM_ID, makeSubmission({}, null), {
        binding: CONTEXT,
      })

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        StepTokenVerificationError,
      )
    })

    describe('with the continuation cookie instead of the step token', () => {
      const mintCpCookie = () => {
        const res = expressHandler.mockResponse()
        setMrfStepAuthCookie(res, {
          ...CONTEXT,
          authType: FormAuthType.CP,
          userName: 'UEN',
          userInfo: 'UID',
        })
        const [name, token] = jest.mocked(res.cookie).mock.calls[0] as [
          string,
          string,
        ]
        return { [name]: token }
      }

      it("returns the step's verified login", () => {
        const result = resolveMrfStepAuth(FORM_ID, makeSubmission(), {
          stepAuthCookies: mintCpCookie(),
        })

        expect(result._unsafeUnwrap().session).toMatchObject({
          ...CONTEXT,
          userName: 'UEN',
          userInfo: 'UID',
        })
      })

      it('rejects a login step without the cookie', () => {
        const result = resolveMrfStepAuth(FORM_ID, makeSubmission(), {
          stepAuthCookies: {},
        })

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(MissingJwtError)
      })

      it('passes a step without login, leaving proof to the caller', () => {
        const result = resolveMrfStepAuth(FORM_ID, makeSubmission({}, null), {
          stepAuthCookies: {},
        })

        expect(result._unsafeUnwrap().context).toBeUndefined()
      })
    })
  })

  describe('login identity values', () => {
    const cpSession = {
      authType: FormAuthType.CP as const,
      userName: '201912345K',
      userInfo: 'FOREIGN-UID-1',
    }

    it('fills Corppass entity and representative from the login', () => {
      expect(getLoginIdentityValue(UEN_FIELD, cpSession)).toBe('201912345K')
      expect(getLoginIdentityValue(UID_FIELD, cpSession)).toBe('FOREIGN-UID-1')
    })

    it('fills the MyInfo NRIC/FIN only after MyInfo login', () => {
      const nric = {
        fieldType: BasicField.Nric,
        myInfo: { attr: 'uinfin' },
      }
      expect(getLoginIdentityValue(nric, cpSession)).toBeUndefined()
      expect(
        getLoginIdentityValue(nric, {
          authType: FormAuthType.MyInfo,
          uinFin: 'S1234567D',
          myInfoAuthSessionId: 'fapi-session-id',
        }),
      ).toBe('S1234567D')
    })

    it('prefills only identity fields, read-only', () => {
      expect(
        prefillLoginIdentityFields(
          [STEP_1_FIELD, UEN_FIELD] as FormFieldDto[],
          cpSession,
        ),
      ).toEqual([{ ...UEN_FIELD, fieldValue: '201912345K', disabled: true }])
    })
  })

  describe('continuation cookie', () => {
    const MYINFO_SESSION = {
      ...CONTEXT,
      authType: FormAuthType.MyInfo as const,
      uinFin: 'S1234567D',
      myInfoAuthSessionId: 'fapi-session-id',
    }
    const mintCookie = (session = MYINFO_SESSION) => {
      const res = expressHandler.mockResponse()
      setMrfStepAuthCookie(res, session)
      const [name, token, options] = jest.mocked(res.cookie).mock
        .calls[0] as unknown[]
      return { name: name as string, token: token as string, options }
    }

    it('is scoped to one submission and the form API path', () => {
      const { name, options } = mintCookie()

      expect(name).toBe(`mrfStepAuth_${FORM_ID}_${SUBMISSION_ID}`)
      expect(options).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        path: `/api/v3/forms/${FORM_ID}`,
      })
    })

    it('verifies for the same step and returns the identity', () => {
      const { name, token } = mintCookie()

      const result = verifyMrfStepAuthCookie(
        { [name]: token },
        { ...CONTEXT, authType: FormAuthType.MyInfo },
      )

      expect(result._unsafeUnwrap()).toMatchObject({
        uinFin: 'S1234567D',
        myInfoAuthSessionId: 'fapi-session-id',
      })
    })

    // Presented under the expected cookie name, so only the payload differs.
    it.each([
      ['step', { workflowStep: 2 }],
      ['step token', { stepTokenHash: 'another-hash' }],
      ['provider', { authType: FormAuthType.CP }],
      ['submission', { submissionId: new ObjectId().toHexString() }],
    ] as const)(
      'does not unlock another %s',
      (_, change: Partial<MrfStepAuthContext>) => {
        const { token } = mintCookie()
        const expected: MrfStepAuthContext = {
          ...CONTEXT,
          authType: FormAuthType.MyInfo,
          ...change,
        }

        const result = verifyMrfStepAuthCookie(
          { [getMrfStepAuthCookieName(expected)]: token },
          expected,
        )

        expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidJwtError)
      },
    )

    it('rejects a cookie signed with the plain session secret', () => {
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

    it('rejects a MyInfo login without its hash session', () => {
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

    it('rejects an expired cookie', () => {
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

    it('outlives the token so an expired login is detectable', () => {
      const { name, options } = mintBinding()

      expect(name).toBe(`cpStepBinding_${NONCE}`)
      expect(options).toMatchObject({
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000,
      })
    })

    it('verifies against the nonce in the callback state', () => {
      const { token } = mintBinding()

      expect(verifyCpStepBinding(token, NONCE)._unsafeUnwrap()).toEqual(CONTEXT)
      expect(
        verifyCpStepBinding(token, 'b'.repeat(32))._unsafeUnwrapErr(),
      ).toBeInstanceOf(InvalidJwtError)
    })

    it('does not accept a continuation cookie as a binding', () => {
      const res = expressHandler.mockResponse()
      setMrfStepAuthCookie(res, {
        ...CONTEXT,
        authType: FormAuthType.CP,
        userName: 'UEN',
        userInfo: 'UID',
      })
      const token = jest.mocked(res.cookie).mock.calls[0][1] as string

      expect(
        verifyCpStepBinding(token, NONCE)._unsafeUnwrapErr(),
      ).toBeInstanceOf(InvalidJwtError)
    })

    it('reports an expired binding with its context', () => {
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
    it.each([
      [
        'keeps only the prefill query ID',
        'queryId=abc123&key=s',
        '?queryId=abc123',
      ],
      ['drops a malformed query ID', 'queryId=//evil.example', ''],
    ])('%s', (_, query, suffix) => {
      expect(
        getMrfContinuationDestination({
          formId: FORM_ID,
          submissionId: SUBMISSION_ID,
          query,
        }),
      ).toBe(`/${FORM_ID}/edit/${SUBMISSION_ID}${suffix}`)
    })
  })

  describe('Corppass later-step login marker', () => {
    const decode = (encoded: string) =>
      Buffer.from(encoded, 'base64').toString('utf8')

    it('adds the submission to the login query and keeps the rest', () => {
      const encoded = withMrfStepLoginMarker(
        Buffer.from('queryId=abc').toString('base64'),
        SUBMISSION_ID,
      )
      const query = decode(encoded)
      expect(query).toContain('queryId=abc')
      expect(getMrfStepLoginSubmissionId(query)).toBe(SUBMISSION_ID)
    })

    it('marks a login with no query', () => {
      expect(
        getMrfStepLoginSubmissionId(
          decode(withMrfStepLoginMarker(undefined, SUBMISSION_ID)),
        ),
      ).toBe(SUBMISSION_ID)
    })

    it.each([
      ['no marker', 'queryId=abc'],
      ['a malformed submission ID', 'mrfStepSubmissionId=../evil'],
      ['no query', undefined],
    ])('finds no step login with %s', (_, query) => {
      expect(getMrfStepLoginSubmissionId(query)).toBeUndefined()
    })
  })
})
