import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import {
  BasicField,
  FormAuthType,
  FormResponseMode,
  WorkflowType,
} from 'formsg-shared/types'
import { ok, okAsync } from 'neverthrow'

import * as AuthService from 'src/app/modules/auth/auth.service'
import { MYINFO_FAPI_SESSION_COOKIE_NAME } from 'src/app/modules/myinfo/fapi/myinfo.fapi.constants'
import * as MyInfoFapiService from 'src/app/modules/myinfo/fapi/myinfo.fapi.service'
import { MyInfoData } from 'src/app/modules/myinfo/myinfo.adapter'
import { MyInfoService } from 'src/app/modules/myinfo/myinfo.service'
import {
  IMultirespondentSubmissionSchema,
  IPopulatedForm,
  IPopulatedMultirespondentForm,
} from 'src/types'

import * as MrfService from '../multirespondent-submission.service'
import { setMrfStepAuthCookie } from '../step-auth'
import {
  _handleMrfStepAuthLogout,
  _handleMrfStepAuthRedirect,
  _handleMrfStepAuthSession,
} from '../step-auth.controller'

jest.mock('src/app/modules/auth/auth.service')
const MockAuthService = jest.mocked(AuthService)
jest.mock('../multirespondent-submission.service')
const MockMrfService = jest.mocked(MrfService)
jest.mock('src/app/modules/myinfo/fapi/myinfo.fapi.service')
const MockFapiService = jest.mocked(MyInfoFapiService)
const mockCreateRedirectUrl = jest.fn()
jest.mock('src/app/modules/spcp/spcp.oidc.service', () => ({
  getOidcService: () => ({
    getCookieDuration: () => 60 * 60 * 1000,
    getCookieSettings: () => ({}),
    getCodeVerifierCookieName: (nonce: string) => `cp_${nonce}`,
    getCodeVerifierCookieOptions: () => ({ path: '/' }),
    createRedirectUrl: mockCreateRedirectUrl,
  }),
}))

const FORM_ID = new ObjectId().toHexString()
const SUBMISSION_ID = new ObjectId().toHexString()
const NAME_FIELD = {
  _id: new ObjectId().toHexString(),
  title: 'Name',
  fieldType: BasicField.ShortText,
  myInfo: { attr: 'name' },
}
const NRIC_FIELD = {
  _id: new ObjectId().toHexString(),
  title: 'Approver NRIC',
  fieldType: BasicField.Nric,
  myInfo: { attr: 'uinfin' },
}
const UEN_FIELD = {
  _id: new ObjectId().toHexString(),
  title: 'Entity UEN',
  fieldType: BasicField.Uen,
  corppass: { attr: 'uen' },
}

const FORM = {
  _id: FORM_ID,
  admin: { email: 'admin@example.gov.sg' },
  responseMode: FormResponseMode.Multirespondent,
} as unknown as IPopulatedForm

const makeSubmission = (
  auth?: FormAuthType.MyInfo | FormAuthType.CP,
  esrvcId = auth === FormAuthType.CP ? 'AGENCY-CP' : undefined,
) =>
  ({
    _id: SUBMISSION_ID,
    form: FORM_ID,
    workflowStep: 0,
    form_fields: [NAME_FIELD, NRIC_FIELD, UEN_FIELD],
    workflow: [
      { workflow_type: WorkflowType.Static, emails: [], edit: [] },
      {
        _id: 'step-2',
        workflow_type: WorkflowType.Static,
        emails: [],
        edit:
          auth === FormAuthType.CP
            ? [UEN_FIELD._id]
            : [NAME_FIELD._id, NRIC_FIELD._id],
        ...(auth ? { auth: { auth_type: auth, esrvc_id: esrvcId } } : {}),
      },
    ],
    submittedSteps: [],
  }) as unknown as IMultirespondentSubmissionSchema

const mockStep = (
  auth?: FormAuthType.MyInfo | FormAuthType.CP,
  esrvcId?: string,
) => {
  MockAuthService.getFormIfPublic.mockReturnValue(okAsync(FORM))
  MockMrfService.checkFormIsMultirespondent.mockReturnValue(
    ok(FORM as IPopulatedMultirespondentForm),
  )
  MockMrfService.getMultirespondentSubmission.mockReturnValue(
    okAsync(makeSubmission(auth, esrvcId)),
  )
}

const makeRequest = ({
  signedCookies,
  ...overrides
}: Record<string, unknown> = {}) =>
  // The helper does not support signed cookies, so set them afterwards.
  Object.assign(
    expressHandler.mockRequest({
      params: { formId: FORM_ID, submissionId: SUBMISSION_ID },
      body: {},
      ...overrides,
    }),
    { signedCookies: signedCookies ?? {} },
  )

const CONTEXT = {
  formId: FORM_ID,
  submissionId: SUBMISSION_ID,
  workflowStep: 1,
}

const mintStepCookie = (
  session: Parameters<typeof setMrfStepAuthCookie>[1],
) => {
  const res = expressHandler.mockResponse()
  setMrfStepAuthCookie(res, session)
  const [name, token] = jest.mocked(res.cookie).mock.calls[0] as [
    string,
    string,
  ]
  return { [name]: token }
}

describe('step-auth.controller', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('_handleMrfStepAuthRedirect', () => {
    it.each([
      ['a step without login', undefined, undefined],
      ['Corppass without an e-service ID', FormAuthType.CP, ''],
    ] as const)('fails closed for %s', async (_, auth, esrvcId) => {
      mockStep(auth, esrvcId)
      const res = expressHandler.mockResponse()

      await _handleMrfStepAuthRedirect(makeRequest(), res, jest.fn())

      expect(res.status).toHaveBeenCalledWith(400)
    })

    // The NRIC/FIN identity field is filled from the login, not requested.
    it("starts a MyInfo login bound to the step, for the step's fields only", async () => {
      mockStep(FormAuthType.MyInfo)
      MockFapiService.startLogin.mockReturnValue(
        okAsync({ sessionId: 'fapi-session', redirectUrl: 'https://singpass' }),
      )
      const res = expressHandler.mockResponse()

      await _handleMrfStepAuthRedirect(makeRequest(), res, jest.fn())

      expect(MockFapiService.startLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          formId: FORM_ID,
          requestedAttributes: ['name'],
          mrfContext: { submissionId: SUBMISSION_ID, workflowStep: 1 },
        }),
      )
      expect(res.json).toHaveBeenCalledWith({ redirectURL: 'https://singpass' })
    })

    it("uses the step's own Corppass e-service and binds the login to the step", async () => {
      mockStep(FormAuthType.CP)
      mockCreateRedirectUrl.mockReturnValue(
        okAsync({ redirectUrl: 'https://corppass', codeVerifier: 'verifier' }),
      )
      const res = expressHandler.mockResponse()

      await _handleMrfStepAuthRedirect(makeRequest(), res, jest.fn())

      expect(mockCreateRedirectUrl).toHaveBeenCalledWith(
        expect.any(String),
        'AGENCY-CP',
      )
      expect(res.json).toHaveBeenCalledWith({ redirectURL: 'https://corppass' })
      expect(res.cookie).toHaveBeenCalledWith(
        expect.stringMatching(/^cpStepBinding_/),
        expect.any(String),
        expect.anything(),
      )
    })
  })

  describe('_handleMrfStepAuthSession', () => {
    it('reports no login for a step saved without one', async () => {
      mockStep()
      const res = expressHandler.mockResponse()

      await _handleMrfStepAuthSession(makeRequest(), res, jest.fn())

      expect(res.json).toHaveBeenCalledWith({
        workflowStep: 1,
        authType: FormAuthType.NIL,
      })
    })

    it('prefills only this step after a fresh MyInfo login, with scoped hashes', async () => {
      mockStep(FormAuthType.MyInfo)
      const myInfoData = {
        getUinFin: () => 'S1234567D',
        getChildrenBirthRecords: () => undefined,
      } as unknown as MyInfoData
      MockFapiService.loadPersonForSession.mockReturnValue(okAsync(myInfoData))
      const prefill = jest
        .spyOn(MyInfoService, 'prefillAndSaveMyInfoFields')
        .mockReturnValue(
          okAsync([
            { ...NAME_FIELD, fieldValue: 'TAN AH KOW', disabled: true },
          ] as never),
        )
      const res = expressHandler.mockResponse()

      await _handleMrfStepAuthSession(
        makeRequest({
          signedCookies: { [MYINFO_FAPI_SESSION_COOKIE_NAME]: 'fapi-session' },
        }),
        res,
        jest.fn(),
      )

      expect(MockFapiService.loadPersonForSession).toHaveBeenCalledWith({
        sessionId: 'fapi-session',
        formId: FORM_ID,
        mrfContext: { submissionId: SUBMISSION_ID, workflowStep: 1 },
      })
      expect(prefill).toHaveBeenCalledWith(
        FORM_ID,
        myInfoData,
        [NAME_FIELD, NRIC_FIELD],
        { authSessionId: 'fapi-session', workflowStep: 1 },
      )
      expect(res.cookie).toHaveBeenCalledWith(
        `mrfStepAuth_${FORM_ID}_${SUBMISSION_ID}`,
        expect.any(String),
        expect.anything(),
      )
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          authType: FormAuthType.MyInfo,
          spcpSession: { userName: 'S1234567D' },
        }),
      )
    })

    it('returns the logged-in Corppass identity fields from the session', async () => {
      mockStep(FormAuthType.CP)
      const res = expressHandler.mockResponse()

      await _handleMrfStepAuthSession(
        makeRequest({
          cookies: mintStepCookie({
            ...CONTEXT,
            authType: FormAuthType.CP,
            userName: '201912345K',
            userInfo: 'UID-1',
          }),
        }),
        res,
        jest.fn(),
      )

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          spcpSession: expect.objectContaining({ userName: '201912345K' }),
          prefilledFields: [
            { ...UEN_FIELD, fieldValue: '201912345K', disabled: true },
          ],
        }),
      )
    })
  })

  describe('_handleMrfStepAuthLogout', () => {
    it("clears the submission's login and only a MyInfo login started for it", async () => {
      MockFapiService.isSessionBoundToSubmission.mockReturnValue(okAsync(false))
      const res = expressHandler.mockResponse()

      await _handleMrfStepAuthLogout(
        makeRequest({
          signedCookies: { [MYINFO_FAPI_SESSION_COOKIE_NAME]: 'other-tab' },
        }),
        res,
        jest.fn(),
      )

      expect(res.clearCookie).toHaveBeenCalledWith(
        `mrfStepAuth_${FORM_ID}_${SUBMISSION_ID}`,
        expect.anything(),
      )
      expect(res.clearCookie).not.toHaveBeenCalledWith(
        MYINFO_FAPI_SESSION_COOKIE_NAME,
        expect.anything(),
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })
})
