import { FormAuthType } from 'formsg-shared/types'

import { spcpMyInfoConfig } from 'src/app/config/features/spcp-myinfo.config'
import { IFormSchema } from 'src/types'

import {
  AuthTypeMismatchError,
  FormAuthNoEsrvcIdError,
} from '../../form/form.errors'
import { getCpLoginEsrvcId, validateSpcpForm } from '../spcp.util'

const mockLoggerError = jest.fn()
jest.mock('src/app/config/logger', () => ({
  createLoggerWithLabel: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: (...args: unknown[]) => mockLoggerError(...args),
  }),
}))

const FORMSG_ESRVC_ID = 'FORMSG-CP'
const AGENCY_ESRVC_ID = 'AGENCY-CP'

const makeForm = (authType: FormAuthType, esrvcId?: string) =>
  ({ id: 'formId', authType, esrvcId }) as unknown as IFormSchema

describe('spcp.util', () => {
  const originalFormsgEsrvcId = spcpMyInfoConfig.cpFormsgEsrvcId

  beforeEach(() => {
    mockLoggerError.mockClear()
    spcpMyInfoConfig.cpFormsgEsrvcId = FORMSG_ESRVC_ID
  })

  afterAll(() => {
    spcpMyInfoConfig.cpFormsgEsrvcId = originalFormsgEsrvcId
  })

  describe('getCpLoginEsrvcId', () => {
    it("uses FormSG's ID when the flag is on, even if the form has its own", () => {
      expect(getCpLoginEsrvcId({ esrvcId: AGENCY_ESRVC_ID }, true)).toBe(
        FORMSG_ESRVC_ID,
      )
    })

    it("falls back to the form's ID when the flag is on but FormSG's is not configured", () => {
      spcpMyInfoConfig.cpFormsgEsrvcId = ''
      expect(getCpLoginEsrvcId({ esrvcId: AGENCY_ESRVC_ID }, true)).toBe(
        AGENCY_ESRVC_ID,
      )
      expect(mockLoggerError).toHaveBeenCalledTimes(1)
    })

    it("uses the form's ID when the flag is off", () => {
      expect(getCpLoginEsrvcId({ esrvcId: AGENCY_ESRVC_ID }, false)).toBe(
        AGENCY_ESRVC_ID,
      )
      expect(getCpLoginEsrvcId({}, false)).toBeUndefined()
      expect(mockLoggerError).not.toHaveBeenCalled()
    })
  })

  describe('validateSpcpForm', () => {
    it("returns FormSG's ID for a CP form without its own when the flag is on", () => {
      const result = validateSpcpForm(makeForm(FormAuthType.CP), true)
      expect(result._unsafeUnwrap()).toBe(FORMSG_ESRVC_ID)
    })

    it('rejects a CP form without an ID when the flag is off', () => {
      const result = validateSpcpForm(makeForm(FormAuthType.CP), false)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(FormAuthNoEsrvcIdError)
    })

    it('keeps requiring an SP form to have its own ID when the flag is on', () => {
      expect(
        validateSpcpForm(makeForm(FormAuthType.SP), true)._unsafeUnwrapErr(),
      ).toBeInstanceOf(FormAuthNoEsrvcIdError)
      expect(
        validateSpcpForm(
          makeForm(FormAuthType.SP, AGENCY_ESRVC_ID),
          true,
        )._unsafeUnwrap(),
      ).toBe(AGENCY_ESRVC_ID)
    })

    it('rejects forms that are not SP or CP', () => {
      const result = validateSpcpForm(
        makeForm(FormAuthType.SGID, AGENCY_ESRVC_ID),
        true,
      )
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(AuthTypeMismatchError)
    })
  })
})
