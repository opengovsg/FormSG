import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { errAsync, ok, okAsync } from 'neverthrow'

import getFormModel from 'src/app/models/form.server.model'
import { handleSns } from 'src/app/modules/bounce/bounce.controller'
import getBounceModel from 'src/app/modules/bounce/bounce.model'
import * as BounceService from 'src/app/modules/bounce/bounce.service'
import * as FormService from 'src/app/modules/form/form.service'
import { EmailType } from 'src/app/services/mail/mail.constants'
import {
  IBounceSchema,
  IEmailNotification,
  IPopulatedForm,
  ISnsNotification,
} from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'
import expressHandler from 'tests/unit/backend/helpers/jest-express'

import { DatabaseError } from '../../core/core.errors'
import { InvalidNotificationError } from '../bounce.errors'

const Bounce = getBounceModel(mongoose)
const FormModel = getFormModel(mongoose)

jest.mock('src/app/modules/bounce/bounce.service')
jest.mock('src/app/modules/form/form.service')
const MockFormService = jest.mocked(FormService)
const MockBounceService = jest.mocked(BounceService)

class MockVersionError extends Error {
  constructor(msg?: string) {
    super(msg)
    this.name = 'MockVersionError'
  }
}
jest.doMock('mongoose', () => ({
  Error: {
    VersionError: MockVersionError,
  },
}))

const MOCK_NOTIFICATION = { notificationType: 'Bounce' } as IEmailNotification
const MOCK_REQ = expressHandler.mockRequest({
  body: {
    Message: JSON.stringify(MOCK_NOTIFICATION),
  } as unknown as ISnsNotification,
})
const MOCK_RES = expressHandler.mockResponse()
const MOCK_EMAIL_RECIPIENTS = ['a@email.com', 'b@email.com']
const MOCK_CONTACTS = [
  {
    email: MOCK_EMAIL_RECIPIENTS[0],
    contact: '+6581234567',
  },
  {
    email: MOCK_EMAIL_RECIPIENTS[1],
    contact: '+6581234568',
  },
]
interface IMockBounce extends IBounceSchema {
  isCriticalBounce: jest.Mock
  areAllPermanentBounces: jest.Mock
  setNotificationState: jest.Mock
  hasNotified: jest.Mock
  save: jest.Mock
}
describe('handleSns', () => {
  let mockBounceDoc: IMockBounce
  let mockForm: IPopulatedForm

  beforeAll(async () => {
    await dbHandler.connect()
    const { user } = await dbHandler.insertFormCollectionReqs()

    const bounceDoc = await new Bounce({
      formId: new ObjectId(),
      bounces: [],
    }).save()
    bounceDoc.isCriticalBounce = jest.fn()
    bounceDoc.setNotificationState = jest.fn()
    bounceDoc.save = jest.fn()
    bounceDoc.areAllPermanentBounces = jest.fn()
    bounceDoc.hasNotified = jest.fn()
    mockBounceDoc = bounceDoc as IMockBounce

    mockForm = (await new FormModel({
      _id: bounceDoc.formId,
      admin: user._id,
      title: 'mockTitle',
    })
      .populate('admin')
      .execPopulate()) as IPopulatedForm
  })

  afterAll(async () => await dbHandler.closeDatabase())

  beforeEach(() => {
    jest.resetAllMocks()
    // Default mocks
    MockBounceService.validateSnsRequest.mockReturnValue(okAsync(true))
    MockBounceService.safeParseNotification.mockReturnValue(
      ok(MOCK_NOTIFICATION),
    )
    MockBounceService.extractEmailType.mockReturnValue(EmailType.AdminResponse)
    MockBounceService.getUpdatedBounceDoc.mockReturnValue(
      okAsync(mockBounceDoc),
    )
    MockFormService.retrieveFullFormById.mockResolvedValue(okAsync(mockForm))
    mockBounceDoc.isCriticalBounce.mockReturnValue(true)
    MockBounceService.getEditorsWithContactNumbers.mockReturnValue(
      okAsync(MOCK_CONTACTS),
    )
    mockBounceDoc.hasNotified.mockReturnValue(false)
    MockBounceService.sendEmailBounceNotification.mockReturnValue(
      okAsync(MOCK_EMAIL_RECIPIENTS),
    )
    MockBounceService.sendSmsBounceNotification.mockReturnValue(
      okAsync(MOCK_CONTACTS),
    )
    MockBounceService.saveBounceDoc.mockReturnValue(okAsync(mockBounceDoc))
    // Note that this is true to simulate permanent bounce
    mockBounceDoc.areAllPermanentBounces.mockReturnValue(true)
  })

  afterEach(async () => await dbHandler.clearDatabase())

  it('should return 401 when requests are invalid', async () => {
    MockBounceService.validateSnsRequest.mockReturnValueOnce(
      errAsync(new InvalidNotificationError()),
    )
    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())
    expect(MockBounceService.validateSnsRequest).toHaveBeenCalledWith(
      MOCK_REQ.body,
    )
    expect(MockBounceService.logEmailNotification).not.toHaveBeenCalled()
    expect(MockFormService.retrieveFullFormById).not.toHaveBeenCalled()
    expect(
      MockBounceService.getEditorsWithContactNumbers,
    ).not.toHaveBeenCalled()
    expect(MockBounceService.sendEmailBounceNotification).not.toHaveBeenCalled()
    expect(MockBounceService.sendSmsBounceNotification).not.toHaveBeenCalled()
    expect(MockFormService.deactivateForm).not.toHaveBeenCalled()
    expect(MockBounceService.notifyAdminsOfDeactivation).not.toHaveBeenCalled()
    expect(MockBounceService.logCriticalBounce).not.toHaveBeenCalled()
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(401)
  })

  it('should call services correctly for permanent critical bounces', async () => {
    // Note that default mocks simulate permanent critical bounce, so no changes
    // to mocks are needed
    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())

    expect(MockBounceService.validateSnsRequest).toHaveBeenCalledWith(
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
    expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
      mockBounceDoc.formId,
    )
    expect(mockBounceDoc.isCriticalBounce).toHaveBeenCalled()
    expect(MockBounceService.getEditorsWithContactNumbers).toHaveBeenCalledWith(
      mockForm,
    )
    expect(mockBounceDoc.hasNotified).toHaveBeenCalled()
    expect(MockBounceService.sendEmailBounceNotification).toHaveBeenCalledWith(
      mockBounceDoc,
      mockForm,
    )
    expect(MockBounceService.sendSmsBounceNotification).toHaveBeenCalledWith(
      mockBounceDoc,
      mockForm,
      MOCK_CONTACTS,
    )
    expect(mockBounceDoc.setNotificationState).toHaveBeenCalledWith(
      MOCK_EMAIL_RECIPIENTS,
      MOCK_CONTACTS,
    )
    expect(mockBounceDoc.areAllPermanentBounces).toHaveBeenCalled()
    expect(MockFormService.deactivateForm).toHaveBeenCalledWith(
      mockBounceDoc.formId,
    )
    expect(MockBounceService.notifyAdminsOfDeactivation).toHaveBeenCalledWith(
      mockForm,
      MOCK_CONTACTS,
    )
    expect(MockBounceService.logCriticalBounce).toHaveBeenCalledWith({
      bounceDoc: mockBounceDoc,
      notification: MOCK_NOTIFICATION,
      autoEmailRecipients: MOCK_EMAIL_RECIPIENTS,
      autoSmsRecipients: MOCK_CONTACTS,
      hasDeactivated: true,
    })
    expect(MockBounceService.saveBounceDoc).toHaveBeenCalledWith(mockBounceDoc)
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(200)
  })

  it('should call services correctly for transient critical bounces', async () => {
    // Note that this is false to simulate transient bounce
    mockBounceDoc.areAllPermanentBounces.mockReturnValueOnce(false)

    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())

    expect(MockBounceService.validateSnsRequest).toHaveBeenCalledWith(
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
    expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
      mockBounceDoc.formId,
    )
    expect(mockBounceDoc.isCriticalBounce).toHaveBeenCalled()
    expect(MockBounceService.getEditorsWithContactNumbers).toHaveBeenCalledWith(
      mockForm,
    )
    expect(mockBounceDoc.hasNotified).toHaveBeenCalled()
    expect(MockBounceService.sendEmailBounceNotification).toHaveBeenCalledWith(
      mockBounceDoc,
      mockForm,
    )
    expect(MockBounceService.sendSmsBounceNotification).toHaveBeenCalledWith(
      mockBounceDoc,
      mockForm,
      MOCK_CONTACTS,
    )
    expect(mockBounceDoc.setNotificationState).toHaveBeenCalledWith(
      MOCK_EMAIL_RECIPIENTS,
      MOCK_CONTACTS,
    )
    expect(mockBounceDoc.areAllPermanentBounces).toHaveBeenCalled()
    // Deactivation functions are not called
    expect(MockFormService.deactivateForm).not.toHaveBeenCalled()
    expect(MockBounceService.notifyAdminsOfDeactivation).not.toHaveBeenCalled()
    expect(MockBounceService.logCriticalBounce).toHaveBeenCalledWith({
      bounceDoc: mockBounceDoc,
      notification: MOCK_NOTIFICATION,
      autoEmailRecipients: MOCK_EMAIL_RECIPIENTS,
      autoSmsRecipients: MOCK_CONTACTS,
      hasDeactivated: false,
    })
    expect(MockBounceService.saveBounceDoc).toHaveBeenCalledWith(mockBounceDoc)
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(200)
  })

  it('should call services correctly when recipients have already been notified of a critical bounce', async () => {
    mockBounceDoc.hasNotified.mockReturnValue(true)

    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())

    expect(MockBounceService.validateSnsRequest).toHaveBeenCalledWith(
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
    expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
      mockBounceDoc.formId,
    )
    expect(mockBounceDoc.isCriticalBounce).toHaveBeenCalled()
    expect(MockBounceService.getEditorsWithContactNumbers).toHaveBeenCalledWith(
      mockForm,
    )
    expect(mockBounceDoc.hasNotified).toHaveBeenCalled()
    // Notification functions are not called
    expect(MockBounceService.sendEmailBounceNotification).not.toHaveBeenCalled()
    expect(MockBounceService.sendSmsBounceNotification).not.toHaveBeenCalled()
    expect(mockBounceDoc.setNotificationState).not.toHaveBeenCalled()
    expect(mockBounceDoc.areAllPermanentBounces).toHaveBeenCalled()
    expect(MockFormService.deactivateForm).toHaveBeenCalledWith(
      mockBounceDoc.formId,
    )
    expect(MockBounceService.notifyAdminsOfDeactivation).toHaveBeenCalledWith(
      mockForm,
      MOCK_CONTACTS,
    )
    expect(MockBounceService.logCriticalBounce).toHaveBeenCalledWith({
      bounceDoc: mockBounceDoc,
      notification: MOCK_NOTIFICATION,
      autoEmailRecipients: [],
      autoSmsRecipients: [],
      hasDeactivated: true,
    })
    expect(MockBounceService.saveBounceDoc).toHaveBeenCalledWith(mockBounceDoc)
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(200)
  })

  it('should return 200 even when errors are thrown in getUpdatedBounceDoc', async () => {
    MockBounceService.getUpdatedBounceDoc.mockReturnValueOnce(
      errAsync(new DatabaseError()),
    )
    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())
    expect(MockBounceService.validateSnsRequest).toHaveBeenCalledWith(
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
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(200)
  })

  it('should return 500 early if error occurs while retrieving form', async () => {
    MockFormService.retrieveFullFormById.mockResolvedValueOnce(
      errAsync(new DatabaseError()),
    )

    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())

    expect(MockBounceService.validateSnsRequest).toHaveBeenCalledWith(
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
    expect(MockFormService.retrieveFullFormById).toHaveBeenLastCalledWith(
      mockBounceDoc.formId,
    )
    expect(
      MockBounceService.getEditorsWithContactNumbers,
    ).not.toHaveBeenCalled()
    expect(MockBounceService.sendEmailBounceNotification).not.toHaveBeenCalled()
    expect(MockBounceService.sendSmsBounceNotification).not.toHaveBeenCalled()
    expect(MockBounceService.notifyAdminsOfDeactivation).not.toHaveBeenCalled()
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(500)
  })

  it('should return 200 even when errors are returned from deactivateForm', async () => {
    MockFormService.deactivateForm.mockReturnValueOnce(
      errAsync(new DatabaseError()),
    )

    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())

    expect(MockBounceService.validateSnsRequest).toHaveBeenCalledWith(
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
    expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
      mockBounceDoc.formId,
    )
    expect(mockBounceDoc.isCriticalBounce).toHaveBeenCalled()
    expect(MockBounceService.getEditorsWithContactNumbers).toHaveBeenCalledWith(
      mockForm,
    )
    expect(mockBounceDoc.hasNotified).toHaveBeenCalled()
    expect(mockBounceDoc.areAllPermanentBounces).toHaveBeenCalled()
    expect(MockFormService.deactivateForm).toHaveBeenCalledWith(
      mockBounceDoc.formId,
    )
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(200)
  })

  it('should return 200 when VersionErrors are thrown', async () => {
    mockBounceDoc.save.mockImplementationOnce(() => {
      throw new MockVersionError()
    })

    await handleSns(MOCK_REQ, MOCK_RES, jest.fn())

    expect(MockBounceService.validateSnsRequest).toHaveBeenCalledWith(
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
    expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
      mockBounceDoc.formId,
    )
    expect(mockBounceDoc.isCriticalBounce).toHaveBeenCalled()
    expect(MockBounceService.getEditorsWithContactNumbers).toHaveBeenCalledWith(
      mockForm,
    )
    expect(mockBounceDoc.hasNotified).toHaveBeenCalled()
    expect(mockBounceDoc.areAllPermanentBounces).toHaveBeenCalled()
    expect(MockFormService.deactivateForm).toHaveBeenCalledWith(
      mockBounceDoc.formId,
    )
    expect(MockBounceService.sendEmailBounceNotification).toHaveBeenCalledWith(
      mockBounceDoc,
      mockForm,
    )
    expect(MockBounceService.sendSmsBounceNotification).toHaveBeenCalledWith(
      mockBounceDoc,
      mockForm,
      MOCK_CONTACTS,
    )
    expect(mockBounceDoc.setNotificationState).toHaveBeenCalledWith(
      MOCK_EMAIL_RECIPIENTS,
      MOCK_CONTACTS,
    )
    expect(MockBounceService.logCriticalBounce).toHaveBeenCalledWith({
      bounceDoc: mockBounceDoc,
      notification: MOCK_NOTIFICATION,
      autoEmailRecipients: MOCK_EMAIL_RECIPIENTS,
      autoSmsRecipients: MOCK_CONTACTS,
      hasDeactivated: true,
    })
    expect(MockBounceService.saveBounceDoc).toHaveBeenCalledWith(mockBounceDoc)
    expect(MOCK_RES.sendStatus).toHaveBeenCalledWith(200)
  })
})
