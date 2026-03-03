import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import moment from 'moment-timezone'
import mongoose, { Query } from 'mongoose'
import { PaymentStatus, Product, ProductId, ProductItem } from 'shared/types'

import getAgencyModel from 'src/app/models/agency.server.model'
import getPaymentModel from 'src/app/models/payment.server.model'

import { InvalidDomainError } from '../../auth/auth.errors'
import { DatabaseError } from '../../core/core.errors'
import { InvalidPaymentProductsError } from '../payments.errors'
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
        gstEnabled: false,
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

  describe('validatePaymentProducts', () => {
    const mockValidProduct = {
      name: 'some name',
      description: 'some description',
      multi_qty: false,
      min_qty: 1,
      max_qty: 1,
      amount_cents: 1000,
      _id: new ObjectId(),
    } as unknown as Product

    const mockValidProductsDefinition = [mockValidProduct]

    const mockValidProductSubmission: ProductItem[] = [
      { data: mockValidProduct, quantity: 1, selected: true },
    ]

    it('should return without error if payment products are valid', () => {
      // Act
      const result = PaymentsService.validatePaymentProducts(
        mockValidProductsDefinition,
        mockValidProductSubmission,
      )

      // Assert
      expect(result.isOk()).toBeTrue()
    })

    it('should return with error if there are duplicate payment products', () => {
      // Arrange
      const mockDuplicatedProductSubmission: ProductItem[] = [
        { data: mockValidProduct, quantity: 1, selected: true },
        { data: mockValidProduct, quantity: 1, selected: true },
      ]

      // Act
      const result = PaymentsService.validatePaymentProducts(
        mockValidProductsDefinition,
        mockDuplicatedProductSubmission,
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidPaymentProductsError,
      )
      expect(result._unsafeUnwrapErr().message).toContain(
        'You have selected a duplicate product.',
      )
    })

    it('should return with error if the payment product id cannot be found', () => {
      // Arrange
      const mockInvalidProductSubmission: ProductItem[] = [
        {
          data: {
            ...mockValidProduct,
            _id: new ObjectId().toString() as ProductId,
          },
          quantity: 1,
          selected: true,
        },
        {
          data: mockValidProduct,
          quantity: 1,
          selected: true,
        },
      ]

      // Act
      const result = PaymentsService.validatePaymentProducts(
        mockValidProductsDefinition,
        mockInvalidProductSubmission,
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidPaymentProductsError,
      )
      expect(result._unsafeUnwrapErr().message).toContain(
        'There has been a change in the products available.',
      )
    })

    it('should return with error if the description has changed', () => {
      // Arrange
      const mockInvalidProductSubmission: ProductItem[] = [
        {
          data: {
            ...mockValidProduct,
            description: 'some other description',
          },
          quantity: 1,
          selected: true,
        },
      ]

      // Act
      const result = PaymentsService.validatePaymentProducts(
        mockValidProductsDefinition,
        mockInvalidProductSubmission,
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidPaymentProductsError,
      )
      expect(result._unsafeUnwrapErr().message).toContain(
        'There has been a change in the products available.',
      )
    })

    it('should return with error if the name has changed', () => {
      // Arrange
      const mockInvalidProductSubmission: ProductItem[] = [
        {
          data: {
            ...mockValidProduct,
            name: 'some other name',
          },
          quantity: 1,
          selected: true,
        },
      ]

      // Act
      const result = PaymentsService.validatePaymentProducts(
        mockValidProductsDefinition,
        mockInvalidProductSubmission,
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidPaymentProductsError,
      )
      expect(result._unsafeUnwrapErr().message).toContain(
        'There has been a change in the products available.',
      )
    })

    it('should return with error if multi_qty has changed', () => {
      // Arrange
      const mockInvalidProductSubmission: ProductItem[] = [
        {
          data: {
            ...mockValidProduct,
            multi_qty: true,
          },
          quantity: 1,
          selected: true,
        },
      ]

      // Act
      const result = PaymentsService.validatePaymentProducts(
        mockValidProductsDefinition,
        mockInvalidProductSubmission,
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidPaymentProductsError,
      )
      expect(result._unsafeUnwrapErr().message).toContain(
        'There has been a change in the products available.',
      )
    })

    it('should return with error if the max_qty has changed', () => {
      // Arrange
      const mockInvalidProductSubmission: ProductItem[] = [
        {
          data: {
            ...mockValidProduct,
            max_qty: 5,
          },
          quantity: 1,
          selected: true,
        },
      ]

      // Act
      const result = PaymentsService.validatePaymentProducts(
        mockValidProductsDefinition,
        mockInvalidProductSubmission,
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidPaymentProductsError,
      )
      expect(result._unsafeUnwrapErr().message).toContain(
        'There has been a change in the products available.',
      )
    })

    it('should return with error if more than 1 quantity selected when multi_qty is disabled', () => {
      // Arrange
      const mockSingleQuantityProduct = {
        name: 'some name',
        description: 'some description',
        multi_qty: false,
        min_qty: 1,
        max_qty: 5,
        amount_cents: 1000,
        _id: new ObjectId(),
      } as unknown as Product

      const mockProductSubmission = [
        { data: mockSingleQuantityProduct, quantity: 2, selected: true },
      ]

      const mockProductDefinition = [mockSingleQuantityProduct]

      // Act

      const result = PaymentsService.validatePaymentProducts(
        mockProductDefinition,
        mockProductSubmission,
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidPaymentProductsError,
      )
      expect(result._unsafeUnwrapErr().message).toContain(
        'Selected more than 1 quantity when it is not allowed',
      )
    })

    it('should return with error if less than min quantity selected when multi_qty is enabled', () => {
      // Arrange
      const mockMultiQuantityProduct = {
        name: 'some name',
        description: 'some description',
        multi_qty: true,
        min_qty: 3,
        max_qty: 5,
        amount_cents: 1000,
        _id: new ObjectId(),
      } as unknown as Product

      const mockProductSubmission = [
        { data: mockMultiQuantityProduct, quantity: 1, selected: true },
      ]

      const mockProductDefinition = [mockMultiQuantityProduct]

      // Act

      const result = PaymentsService.validatePaymentProducts(
        mockProductDefinition,
        mockProductSubmission,
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidPaymentProductsError,
      )
      expect(result._unsafeUnwrapErr().message).toContain(
        'Selected an invalid quantity below the limit',
      )
    })

    it('should return with error if more than max quantity selected when multi_qty is enabled', () => {
      // Arrange
      const mockMultiQuantityProduct = {
        name: 'some name',
        description: 'some description',
        multi_qty: true,
        min_qty: 3,
        max_qty: 5,
        amount_cents: 1000,
        _id: new ObjectId(),
      } as unknown as Product

      const mockProductSubmission = [
        { data: mockMultiQuantityProduct, quantity: 10, selected: true },
      ]

      const mockProductDefinition = [mockMultiQuantityProduct]

      // Act

      const result = PaymentsService.validatePaymentProducts(
        mockProductDefinition,
        mockProductSubmission,
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidPaymentProductsError,
      )
      expect(result._unsafeUnwrapErr().message).toContain(
        'Selected an invalid quantity above the limit',
      )
    })

    it('should return with error if submitted price is not the same as in form definition', () => {
      // Arrange
      const mockProductWithCorrectPrice = {
        name: 'some name',
        description: 'some description',
        multi_qty: true,
        min_qty: 3,
        max_qty: 5,
        amount_cents: 1000,
        _id: new ObjectId(),
      } as unknown as Product

      const mockProductWithIncorrectPrice = {
        ...mockProductWithCorrectPrice,
        amount_cents: 500,
      }

      const mockProductSubmissionWithIncorrectPrice = [
        {
          data: mockProductWithIncorrectPrice,
          quantity: 3,
          selected: true,
        },
      ]

      const mockProductDefinition = [mockProductWithCorrectPrice]

      // Act

      const result = PaymentsService.validatePaymentProducts(
        mockProductDefinition,
        mockProductSubmissionWithIncorrectPrice,
      )

      // Assert
      expect(result.isErr()).toBeTrue()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        InvalidPaymentProductsError,
      )
      expect(result._unsafeUnwrapErr().message).toContain(
        'There has been a change in the products available',
      )
    })
  })

  describe('findLatestSuccessfulPaymentByEmailAndFormId', () => {
    const expectedObjectId = new ObjectId()
    const email = 'someone@mail.com'
    const now = moment().utc()

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
        gstEnabled: false,
        completedPayment: {
          paymentDate: now.toDate(),
          receiptUrl: 'https://form.gov.sg',
          submissionId: new ObjectId().toHexString(),
          transactionFee: 0,
        },
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

    it('should return the latest payment based on completed payment date', async () => {
      // create a payment object with an older successful payment date
      await Payment.create({
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        paymentIntentId: 'somePaymentIntentId',
        amount: 314159,
        email: email,
        status: PaymentStatus.Succeeded,
        gstEnabled: false,
        completedPayment: {
          paymentDate: now.subtract(1, 'days').toDate(),
          receiptUrl: 'https://form.gov.sg',
          submissionId: new ObjectId().toHexString(),
          transactionFee: 0,
        },
      })

      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          email,
          MOCK_FORM_ID,
        )

      // Assert latest payment document
      result.map((payment) => {
        expect(payment.id).toEqual(expectedObjectId.toHexString())
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
        gstEnabled: false,
      })
      const result =
        await PaymentsService.findLatestSuccessfulPaymentByEmailAndFormId(
          newEmail,
          newFormId,
        )
      expect(result.isErr()).toBeTrue()
    })
    it('should return with error if there is no successful payments for the email and formId within the last 30 days', async () => {
      const newEmail = 'new@new.com'
      const newFormId = new ObjectId().toHexString()
      await Payment.create({
        formId: newFormId,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: new ObjectId(),
        paymentIntentId: 'somePaymentIntentId',
        amount: 314159,
        email: newEmail,
        status: PaymentStatus.Succeeded,
        gstEnabled: false,
        completedPayment: {
          receiptUrl: 'https://form.gov.sg',
          submissionId: new ObjectId().toHexString(),
          paymentDate: moment().subtract(31, 'days').utc().toDate(),
          transactionFee: 0,
        },
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
        gstEnabled: false,
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
      const result =
        await PaymentsService.sendOnboardingEmailIfEligible(MOCK_VALID_EMAIL)

      // Assert
      expect(result.isOk()).toBeTrue()
    })

    it('should return DatabaseError if mongo query fails', async () => {
      const execSpy = jest.fn().mockRejectedValueOnce(new Error('boom'))
      jest.spyOn(AgencyModel, 'findOne').mockReturnValueOnce({
        exec: execSpy,
      } as unknown as Query<any, any>)

      // Act
      const result =
        await PaymentsService.sendOnboardingEmailIfEligible(MOCK_VALID_EMAIL)

      // Assert
      expect(result.isErr()).toBeTrue()
      const databaseErr = result._unsafeUnwrapErr()
      expect(databaseErr).toBeInstanceOf(DatabaseError)
    })

    it('should return a InvalidDomainError if string is not an email', async () => {
      // Act
      const result =
        await PaymentsService.sendOnboardingEmailIfEligible('hello@world')

      // Assert
      expect(result.isErr()).toBeTrue()
      const databaseErr = result._unsafeUnwrapErr()
      expect(databaseErr).toBeInstanceOf(InvalidDomainError)
    })

    it('should return a InvalidDomainError if email domain is not whitelisted', async () => {
      // Act
      const result =
        await PaymentsService.sendOnboardingEmailIfEligible('hello@world.com')

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
      const result =
        await PaymentsService.sendOnboardingEmailIfEligible('hello@world.com')

      // Assert
      expect(result.isErr()).toBeTrue()
      const databaseErr = result._unsafeUnwrapErr()
      expect(databaseErr).toBeInstanceOf(InvalidDomainError)
    })
  })
})
