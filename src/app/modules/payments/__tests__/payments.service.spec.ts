import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import mongoose, { Query } from 'mongoose'
import { PaymentStatus } from 'shared/types'

import getAgencyModel from 'src/app/models/agency.server.model'
import getPaymentModel from 'src/app/models/payment.server.model'

import { InvalidDomainError } from '../../auth/auth.errors'
import { DatabaseError } from '../../core/core.errors'
import * as PaymentsService from '../payments.service'

const Payment = getPaymentModel(mongoose)
const AgencyModel = getAgencyModel(mongoose)
const MOCK_FORM_ID = new ObjectId().toHexString()

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))

describe('payments.service', () => {
  beforeEach(async () => {
    await dbHandler.connect()
    jest.clearAllMocks()
  })
  afterEach(async () => await dbHandler.closeDatabase())

  describe('findPaymentById', () => {
    beforeEach(async () => {
      await dbHandler.clearCollection(Payment.collection.name)
    })
    afterEach(() => jest.clearAllMocks())

    it('should return without error if payment id is found', async () => {
      // Arrange
      const expectedObjectId = new ObjectId()
      await Payment.create({
        _id: expectedObjectId,
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        paymentIntentId: 'somePaymentIntentId',
        amount: 314159,
        email: 'someone@mail.com',
      })

      // Act
      const result = await PaymentsService.findPaymentById(
        expectedObjectId.toHexString(),
      )

      // Assert
      expect(result.isOk()).toBeTrue()
    })

    it('should return with error if payment id is not found', async () => {
      const result = await PaymentsService.findPaymentById(
        new ObjectId().toHexString(),
      )
      expect(result.isErr()).toBeTrue()
    })

    it('should return with error if mongodb is not ready', async () => {
      await dbHandler.closeDatabase()
      const result = await PaymentsService.findPaymentById(
        new ObjectId().toHexString(),
      )
      expect(result.isErr()).toBeTrue()
    })
  })

  describe('findLatestSuccessfulPaymentByEmailAndFormId', () => {
    const expectedObjectId = new ObjectId()
    const email = 'someone@mail.com'

    beforeEach(async () => {
      await dbHandler.clearCollection(Payment.collection.name)
      await Payment.create({
        _id: expectedObjectId,
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        paymentIntentId: 'somePaymentIntentId',
        amount: 314159,
        email: email,
        status: PaymentStatus.Succeeded,
      })
    })
    afterEach(() => jest.clearAllMocks())

    it('should return without error if payment document is found', async () => {
      // Act
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          email,
          MOCK_FORM_ID,
        )

      // Assert
      expect(result.isOk()).toBeTrue()
    })

    it('should return the latest payment based on id creation', async () => {
      const latestId = new ObjectId()
      // create the latest payment object
      await Payment.create({
        _id: latestId,
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        paymentIntentId: 'somePaymentIntentId',
        amount: 314159,
        email: email,
        status: PaymentStatus.Succeeded,
      })
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          email,
          MOCK_FORM_ID,
        )

      // Assert latest payment document
      result.map((payment) => {
        expect(payment.id).toEqual(latestId.toHexString())
      })

      // Assert
      expect(result.isOk()).toBeTrue()
    })

    it('should return with error if email is not found in any payment document', async () => {
      const missingEmail = 'missing@missing.com'
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          missingEmail,
          MOCK_FORM_ID,
        )
      expect(result.isErr()).toBeTrue()
    })

    it('should return with error if formId is not found in any payment document', async () => {
      const missingFormId = new ObjectId().toHexString()
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          email,
          missingFormId,
        )
      expect(result.isErr()).toBeTrue()
    })

    it('should return with error if there is no successful payments for the email and formId', async () => {
      const newEmail = 'new@new.com'
      const newFormId = new ObjectId().toHexString()
      const newId = new ObjectId()
      await Payment.create({
        _id: newId,
        formId: newFormId,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        paymentIntentId: 'somePaymentIntentId',
        amount: 314159,
        email: newEmail,
        status: PaymentStatus.Pending,
      })
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          newEmail,
          newFormId,
        )
      expect(result.isErr()).toBeTrue()
    })

    it('should return with error if mongodb is not ready', async () => {
      await dbHandler.closeDatabase()
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          email,
          MOCK_FORM_ID,
        )
      expect(result.isErr()).toBeTrue()
    })
  })

  describe('getIncompletePayments', () => {
    beforeEach(async () => {
      await dbHandler.clearCollection(Payment.collection.name)
    })

    it('should return only the incomplete payments from the collection', async () => {
      // Arrange
      const MOCK_PAYMENT = {
        paymentIntentId: 'pi_MOCK_ID',
        amount: 1000,
        email: 'formsg@tech.gov.sg',
        targetAccountId: 'acct_MOCK_ID',
        formId: new ObjectId(),
        pendingSubmissionId: new ObjectId(),
      }

      await Payment.create({
        ...MOCK_PAYMENT,
        status: PaymentStatus.Pending,
      })
      await Payment.create({
        ...MOCK_PAYMENT,
        status: PaymentStatus.Failed,
      })
      await Payment.create({
        ...MOCK_PAYMENT,
        status: PaymentStatus.Succeeded,
      })
      await Payment.create({
        ...MOCK_PAYMENT,
        status: PaymentStatus.Canceled,
      })
      await Payment.create({
        ...MOCK_PAYMENT,
        status: PaymentStatus.FullyRefunded,
      })

      // Act
      const result = await PaymentsService.getIncompletePayments()

      // Assert
      expect(result.isOk()).toBe(true)
      const incompletePayments = result._unsafeUnwrap()
      expect(incompletePayments).toBeArrayOfSize(2)
      expect(incompletePayments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            status: expect.toBeOneOf([
              PaymentStatus.Pending,
              PaymentStatus.Failed,
            ]),
          }),
        ]),
      )
    })

    it('should return a DatabaseError if the database throws an error', async () => {
      // Arrange
      const getSpy = jest.spyOn(Payment, 'getByStatus')
      getSpy.mockImplementationOnce(() => Promise.reject('boom!'))

      // Act
      const result = await PaymentsService.getIncompletePayments()

      // Assert
      expect(result.isErr()).toBe(true)
      const incompletePaymentsErr = result._unsafeUnwrapErr()
      expect(incompletePaymentsErr).toBeInstanceOf(DatabaseError)
    })
  })

  describe('sendOnboardingEmailIfEligible', () => {
    const MOCK_AGENCY_DOMAIN = 'test.gov.sg'
    const MOCK_VALID_EMAIL = `hello@${MOCK_AGENCY_DOMAIN}`

    beforeEach(async () => {
      await dbHandler.insertAgency({ mailDomain: MOCK_AGENCY_DOMAIN })
    })

    it('should send onboarding email if email domain is valid', async () => {
      // Act
      const result = await PaymentsService.sendOnboardingEmailIfEligible(
        MOCK_VALID_EMAIL,
      )

      // Assert
      expect(result.isOk()).toBeTrue()
    })

    it('should return DatabaseError if mongo query fails', async () => {
      const execSpy = jest.fn().mockRejectedValueOnce(new Error('boom'))
      jest.spyOn(AgencyModel, 'findOne').mockReturnValueOnce({
        exec: execSpy,
      } as unknown as Query<any, any>)

      // Act
      const result = await PaymentsService.sendOnboardingEmailIfEligible(
        MOCK_VALID_EMAIL,
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      const databaseErr = result._unsafeUnwrapErr()
      expect(databaseErr).toBeInstanceOf(DatabaseError)
    })

    it('should return a InvalidDomainError if string is not an email', async () => {
      // Act
      const result = await PaymentsService.sendOnboardingEmailIfEligible(
        'hello@world',
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      const databaseErr = result._unsafeUnwrapErr()
      expect(databaseErr).toBeInstanceOf(InvalidDomainError)
    })

    it('should return a InvalidDomainError if email domain is not whitelisted', async () => {
      // Act
      const result = await PaymentsService.sendOnboardingEmailIfEligible(
        'hello@world.com',
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      const databaseErr = result._unsafeUnwrapErr()
      expect(databaseErr).toBeInstanceOf(InvalidDomainError)
    })

    it('should return a MailSendError if nodemailer failed to send mail', async () => {
      // Arrange
      jest.mock('nodemailer', () => ({
        createTransport: jest.fn().mockReturnValue({
          sendMail: jest.fn().mockRejectedValueOnce(false),
        }),
      }))

      // Act
      const result = await PaymentsService.sendOnboardingEmailIfEligible(
        'hello@world.com',
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      const databaseErr = result._unsafeUnwrapErr()
      expect(databaseErr).toBeInstanceOf(InvalidDomainError)
    })
  })
})
