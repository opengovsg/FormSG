import { errAsync, okAsync } from 'neverthrow'

import { IPopulatedForm } from 'src/types'

import { ApplicationError } from '../../../core/core.errors'
import { FormWhitelistSettingNotFoundError } from '../../../form/form.errors'
import * as FormService from '../../../form/form.service'
import { MissingSubmitterIdError } from '../../submission.errors'
import { ensureSubmitterIdIsWhitelisted } from '../multirespondent-submission.ensures'
import { SubmitMultirespondentFormHandlerRequest } from '../multirespondent-submission.types'

jest.mock('../../../form/form.service')
const MockFormService = jest.mocked(FormService)

const createMockReq = (submitterId?: string) =>
  ({
    formsg: {
      encryptedPayload: {
        submitterId,
      },
    },
  }) as unknown as SubmitMultirespondentFormHandlerRequest

const createMockRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
})

const createMockContext = (submitterId?: string) => ({
  req: createMockReq(submitterId),
  res: createMockRes() as any,
  logMeta: { action: 'test' },
  form: {} as IPopulatedForm,
})

describe('Multirespondent Submission Ensures', () => {
  afterEach(() => jest.clearAllMocks())

  describe('ensureSubmitterIdIsWhitelisted', () => {
    it('should respond with 500 if form whitelist setting is not found despite whitelist being enabled', async () => {
      MockFormService.checkHasRespondentNotWhitelistedFailure.mockReturnValueOnce(
        errAsync(new FormWhitelistSettingNotFoundError()),
      )
      const next = jest.fn()
      const ctx = createMockContext('mockSubmitterId')

      await ensureSubmitterIdIsWhitelisted(ctx, next)

      expect(ctx.res.status).toHaveBeenCalledWith(500)
      expect(ctx.res.json).toHaveBeenCalled()
      expect(next).not.toHaveBeenCalled()
    })

    it('should respond with 500 if submitterId is not found despite whitelist being enabled', async () => {
      MockFormService.checkHasRespondentNotWhitelistedFailure.mockReturnValueOnce(
        errAsync(new MissingSubmitterIdError()),
      )
      const next = jest.fn()
      const ctx = createMockContext(undefined)

      await ensureSubmitterIdIsWhitelisted(ctx, next)

      expect(ctx.res.status).toHaveBeenCalledWith(500)
      expect(ctx.res.json).toHaveBeenCalled()
      expect(next).not.toHaveBeenCalled()
    })

    it('should respond with 500 if unexpected ApplicationError is thrown', async () => {
      MockFormService.checkHasRespondentNotWhitelistedFailure.mockReturnValueOnce(
        errAsync(new ApplicationError('Unexpected error')),
      )
      const next = jest.fn()
      const ctx = createMockContext('mockSubmitterId')

      await ensureSubmitterIdIsWhitelisted(ctx, next)

      expect(ctx.res.status).toHaveBeenCalledWith(500)
      expect(ctx.res.json).toHaveBeenCalled()
      expect(next).not.toHaveBeenCalled()
    })

    it('should respond with 403 if submitterId is not whitelisted', async () => {
      MockFormService.checkHasRespondentNotWhitelistedFailure.mockReturnValueOnce(
        okAsync(true),
      )
      const next = jest.fn()
      const ctx = createMockContext('mockSubmitterId')

      await ensureSubmitterIdIsWhitelisted(ctx, next)

      expect(ctx.res.status).toHaveBeenCalledWith(403)
      expect(ctx.res.json).toHaveBeenCalled()
      expect(next).not.toHaveBeenCalled()
    })

    it('should invoke next if submitterId is whitelisted', async () => {
      MockFormService.checkHasRespondentNotWhitelistedFailure.mockReturnValueOnce(
        okAsync(false),
      )
      const next = jest.fn()
      const ctx = createMockContext('mockSubmitterId')

      await ensureSubmitterIdIsWhitelisted(ctx, next)

      expect(ctx.res.status).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledTimes(1)
    })
  })
})
