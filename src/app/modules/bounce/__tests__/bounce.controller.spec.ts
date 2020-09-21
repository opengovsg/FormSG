import { ObjectId } from 'bson'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import expressHandler from 'tests/unit/backend/helpers/jest-express'
import { mocked } from 'ts-jest/utils'

import { EmailType } from 'src/app/constants/mail'
// eslint-disable-next-line import/first
import { handleSns } from 'src/app/modules/bounce/bounce.controller'
import getBounceModel from 'src/app/modules/bounce/bounce.model'
import * as BounceService from 'src/app/modules/bounce/bounce.service'
import * as FormService from 'src/app/modules/form/form.service'
import { IBounceSchema, ISnsNotification } from 'src/types'

const Bounce = getBounceModel(mongoose)

jest.mock('src/app/modules/bounce/bounce.service')
jest.mock('src/app/modules/form/form.service')
const MockBounceService = mocked(BounceService, true)
const MockFormService = mocked(FormService, true)

const MOCK_NOTIFICATION = { someKey: 'someValue' }
const MOCK_REQ = expressHandler.mockRequest({
  body: ({
    Message: JSON.stringify(MOCK_NOTIFICATION),
  } as unknown) as ISnsNotification,
})
const MOCK_RES = expressHandler.mockResponse()
const MOCK_EMAIL_RECIPIENTS = ['a@email.com', 'b@email.com']
interface IMockBounce extends IBounceSchema {
  isCriticalBounce: jest.Mock
  areAllPermanentBounces: jest.Mock
  setHasAutoEmailed: jest.Mock
  save: jest.Mock
}
describe('handleSns', () => {
  let mockBounceDoc: IMockBounce

  beforeAll(async () => {
    await dbHandler.connect()
    const bounceDoc = await new Bounce({
      formId: new ObjectId(),
      bounces: [],
    }).save()
    bounceDoc.isCriticalBounce = jest.fn()
    bounceDoc.setHasAutoEmailed = jest.fn()
    bounceDoc.save = jest.fn()
    bounceDoc.areAllPermanentBounces = jest.fn()
    mockBounceDoc = bounceDoc as IMockBounce
  })

  afterAll(async () => await dbHandler.closeDatabase())

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })

  it('should return immediately when requests are invalid', async () => {
    MockBounceService.isValidSnsRequest.mockResolvedValueOnce(false)
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

  it('should call services correctly for permanent critical bounces', async () => {
    MockBounceService.isValidSnsRequest.mockResolvedValueOnce(true)
    MockBounceService.extractEmailType.mockReturnValueOnce(
      EmailType.AdminResponse,
    )
    MockBounceService.getUpdatedBounceDoc.mockResolvedValueOnce(mockBounceDoc)
    mockBounceDoc.areAllPermanentBounces.mockReturnValueOnce(true)
    mockBounceDoc.isCriticalBounce.mockReturnValueOnce(true)
    MockBounceService.notifyAdminOfBounce.mockResolvedValueOnce(
      MOCK_EMAIL_RECIPIENTS,
    )

    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())

    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(
      MOCK_REQ.body,
    )
    expect(MockBounceService.logEmailNotification).toHaveBeenCalledWith(
      MOCK_NOTIFICATION,
    )
    expect(MockBounceService.extractEmailType).toHaveBeenCalledWith(
      MOCK_NOTIFICATION,
    )
    expect(MockBounceService.getUpdatedBounceDoc).toHaveBeenCalledWith(
      MOCK_NOTIFICATION,
    )
    expect(mockBounceDoc.areAllPermanentBounces).toHaveBeenCalled()
    expect(MockFormService.deactivateForm).toHaveBeenCalledWith(
      mockBounceDoc.formId,
    )
    expect(MockBounceService.notifyAdminOfBounce).toHaveBeenCalledWith(
      mockBounceDoc,
    )
    expect(mockBounceDoc.setHasAutoEmailed).toHaveBeenCalledWith(
      MOCK_EMAIL_RECIPIENTS,
    )
    expect(MockBounceService.logCriticalBounce).toHaveBeenCalledWith(
      mockBounceDoc,
      MOCK_NOTIFICATION,
      MOCK_EMAIL_RECIPIENTS,
    )
    expect(mockBounceDoc.save).toHaveBeenCalled()
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(StatusCodes.OK)
  })

  it('should return 400 when errors are thrown in getUpdatedBounceDoc', async () => {
    MockBounceService.isValidSnsRequest.mockResolvedValueOnce(true)
    MockBounceService.extractEmailType.mockReturnValueOnce(
      EmailType.AdminResponse,
    )
    MockBounceService.getUpdatedBounceDoc.mockImplementationOnce(() => {
      throw new Error()
    })
    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())
    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(
      MOCK_REQ.body,
    )
    expect(MockBounceService.logEmailNotification).toHaveBeenCalledWith(
      MOCK_NOTIFICATION,
    )
    expect(MockBounceService.extractEmailType).toHaveBeenCalledWith(
      MOCK_NOTIFICATION,
    )
    expect(MockBounceService.getUpdatedBounceDoc).toHaveBeenCalledWith(
      MOCK_NOTIFICATION,
    )
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
  })

  it('should return 400 when errors are thrown in deactivateForm', async () => {
    MockBounceService.isValidSnsRequest.mockResolvedValueOnce(true)
    MockBounceService.extractEmailType.mockReturnValueOnce(
      EmailType.AdminResponse,
    )
    MockBounceService.getUpdatedBounceDoc.mockResolvedValueOnce(mockBounceDoc)
    mockBounceDoc.areAllPermanentBounces.mockReturnValueOnce(true)
    MockFormService.deactivateForm.mockImplementationOnce(() => {
      throw new Error()
    })

    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())

    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(
      MOCK_REQ.body,
    )
    expect(MockBounceService.logEmailNotification).toHaveBeenCalledWith(
      MOCK_NOTIFICATION,
    )
    expect(MockBounceService.extractEmailType).toHaveBeenCalledWith(
      MOCK_NOTIFICATION,
    )
    expect(MockBounceService.getUpdatedBounceDoc).toHaveBeenCalledWith(
      MOCK_NOTIFICATION,
    )
    expect(mockBounceDoc.areAllPermanentBounces).toHaveBeenCalled()
    expect(MockFormService.deactivateForm).toHaveBeenCalledWith(
      mockBounceDoc.formId,
    )
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
  })

  it('should return 400 when errors are thrown in notifyAdminOfBounce', async () => {
    MockBounceService.isValidSnsRequest.mockResolvedValueOnce(true)
    MockBounceService.extractEmailType.mockReturnValueOnce(
      EmailType.AdminResponse,
    )
    MockBounceService.getUpdatedBounceDoc.mockResolvedValueOnce(mockBounceDoc)
    mockBounceDoc.areAllPermanentBounces.mockReturnValueOnce(true)
    mockBounceDoc.isCriticalBounce.mockReturnValueOnce(true)
    MockBounceService.notifyAdminOfBounce.mockImplementationOnce(() => {
      throw new Error()
    })

    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())

    expect(MockBounceService.isValidSnsRequest).toHaveBeenCalledWith(
      MOCK_REQ.body,
    )
    expect(MockBounceService.logEmailNotification).toHaveBeenCalledWith(
      MOCK_NOTIFICATION,
    )
    expect(MockBounceService.extractEmailType).toHaveBeenCalledWith(
      MOCK_NOTIFICATION,
    )
    expect(MockBounceService.getUpdatedBounceDoc).toHaveBeenCalledWith(
      MOCK_NOTIFICATION,
    )
    expect(mockBounceDoc.areAllPermanentBounces).toHaveBeenCalled()
    expect(MockFormService.deactivateForm).toHaveBeenCalledWith(
      mockBounceDoc.formId,
    )
    expect(MockBounceService.notifyAdminOfBounce).toHaveBeenCalledWith(
      mockBounceDoc,
    )
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST)
  })
})
