import { ObjectId } from 'bson'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import expressHandler from 'tests/unit/backend/helpers/jest-express'
import { mocked } from 'ts-jest/utils'

import { handleSns } from 'src/app/modules/bounce/bounce.controller'
import getBounceModel from 'src/app/modules/bounce/bounce.model'
import * as BounceService from 'src/app/modules/bounce/bounce.service'
import { IBounceSchema, ISnsNotification } from 'src/types'

const Bounce = getBounceModel(mongoose)

jest.mock('src/app/modules/bounce/bounce.service')
const MockBounceService = mocked(BounceService, true)

const MOCK_NOTIFICATION = 'someValue'
const MOCK_REQ = expressHandler.mockRequest({
  body: ({ Message: MOCK_NOTIFICATION } as unknown) as ISnsNotification,
})
const MOCK_RES = expressHandler.mockResponse()
const MOCK_EMAIL_RECIPIENTS = ['a@email.com', 'b@email.com']
interface IMockBounce extends IBounceSchema {
  isCriticalBounce: jest.Mock
  updateHasEmailed: jest.Mock
  save: jest.Mock
}
describe('handleSns', () => {
  let mockBounceDoc: IMockBounce
  beforeAll(async () => {
    const bounceDoc = await new Bounce({
      formId: new ObjectId(),
      bounces: [],
    }).save()
    bounceDoc.isCriticalBounce = jest.fn()
    bounceDoc.updateHasEmailed = jest.fn()
    bounceDoc.save = jest.fn()
    mockBounceDoc = bounceDoc as IMockBounce
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return immediately when requests are invalid', async () => {
    MockBounceService.isValidSnsRequest.mockReturnValueOnce(
      Promise.resolve(false),
    )
    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())
    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(
      MOCK_REQ.body,
    )
    expect(MockBounceService.logEmailNotification).not.toHaveBeenCalled()
    expect(MockBounceService.notifyAdminOfBounce).not.toHaveBeenCalled()
    expect(MockBounceService.logCriticalBounce).not.toHaveBeenCalled()
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
  })

  it('should return 400 when errors are thrown in isValidSnsRequest', async () => {
    MockBounceService.isValidSnsRequest.mockImplementation(() => {
      throw new Error()
    })
    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())
    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(
      MOCK_REQ.body,
    )
    expect(MockBounceService.logEmailNotification).not.toHaveBeenCalled()
    expect(MockBounceService.notifyAdminOfBounce).not.toHaveBeenCalled()
    expect(MockBounceService.logCriticalBounce).not.toHaveBeenCalled()
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
  })
})
