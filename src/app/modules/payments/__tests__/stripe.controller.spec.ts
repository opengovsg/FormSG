import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import axios from 'axios'
import { ObjectId } from 'bson'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { errAsync, ok, okAsync } from 'neverthrow'
import { PaymentStatus, ProductItem, SubmissionType } from 'shared/types'
import Stripe from 'stripe'
import { MarkRequired } from 'ts-essentials'

import getPaymentModel from 'src/app/models/payment.server.model'
import { getEncryptPendingSubmissionModel } from 'src/app/models/pending_submission.server.model'
import * as ConvertHtmlToPdf from 'src/app/utils/convert-html-to-pdf'
import {
  IPaymentSchema,
  IPopulatedEncryptedForm,
  IPopulatedForm,
} from 'src/types'

import config from '../../../config/config'
import { FormNotFoundError } from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import * as EncryptSubmissionService from '../../submission/encrypt-submission/encrypt-submission.service'
import * as StripeController from '../stripe.controller'
import * as StripeService from '../stripe.service'
import * as StripeUtils from '../stripe.utils'

const Payment = getPaymentModel(mongoose)
const EncryptPendingSubmission = getEncryptPendingSubmissionModel(mongoose)

const MOCK_FORM_ID = new ObjectId().toHexString()

jest.mock('axios')
jest.mock('src/app/modules/payments/stripe.utils')
jest.mock('src/app/utils/convert-html-to-pdf')

jest.mock(
  'src/app/modules/submission/encrypt-submission/encrypt-submission.service',
)
const MockEncryptSubmissionService = jest.mocked(EncryptSubmissionService)

jest.mock('../../form/form.service')
const MockFormService = jest.mocked(FormService)

jest.mock('src/app/modules/payments/stripe.service', () => {
  const allAutoMocked = jest.createMockFromModule(
    'src/app/modules/payments/stripe.service',
  )
  const actual = jest.requireActual('src/app/modules/payments/stripe.service')
  return {
    __esModules: true,

    // first start with all the module's functions auto-mocked
    ...allAutoMocked,

    // then override any module's function that we want to use the *real* implementations for
    generatePaymentInvoice: actual.generatePaymentInvoice,
  }
})
const MockStripeService = jest.mocked(StripeService)

describe('stripe.controller', () => {
  beforeAll(async () => await dbHandler.connect())
  afterAll(async () => await dbHandler.closeDatabase())
  beforeEach(() => jest.clearAllMocks())

  describe('downloadPaymentInvoice', () => {
    const mockBusinessInfo = {
      address: 'localhost',
      gstRegNo: 'G123456',
    }
    const mockFormTitle = 'Mock Form Title'
    const mockSubmissionId = 'MOCK_SUBMISSION_ID'
    const mockProducts: ProductItem[] = []
    const mockInvoiceArgs = {
      ...mockBusinessInfo,
      formTitle: mockFormTitle,
      submissionId: mockSubmissionId,
      gstApplicable: false,
      products: mockProducts,
    }
    const mockForm = {
      _id: MOCK_FORM_ID,
      admin: {
        agency: {
          business: mockBusinessInfo,
        },
      },
      title: mockFormTitle,
    } as IPopulatedForm

    let payment: IPaymentSchema

    beforeEach(async () => {
      await dbHandler.clearCollection(Payment.collection.name)
      await dbHandler.clearCollection(EncryptPendingSubmission.collection.name)
      const pendingSubmission = await EncryptPendingSubmission.create({
        submissionType: SubmissionType.Encrypt,
        form: MOCK_FORM_ID,
        encryptedContent: 'some random encrypted content',
        version: 1,
      })

      payment = await Payment.create({
        formId: mockForm._id,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: pendingSubmission._id,
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: 'formsg@tech.gov.sg',
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',
          submissionId: mockSubmissionId,
        },
        gstEnabled: false,
      })
    })
    it('should generate return a pdf file when receipt url is present', async () => {
      MockFormService.retrieveFullFormById.mockReturnValue(okAsync(mockForm))
      MockEncryptSubmissionService.checkFormIsEncryptMode.mockReturnValue(
        ok(mockForm as IPopulatedEncryptedForm),
      )
      const mockReq = expressHandler.mockRequest({
        params: { formId: mockForm._id, paymentId: payment._id },
      })
      const mockRes = expressHandler.mockResponse()
      const axiosSpy = jest
        .spyOn(axios, 'get')
        .mockResolvedValueOnce({ data: '<html>some html</html>' })

      const convertInvoiceSpy = jest
        .spyOn(StripeUtils, 'convertToProofOfPaymentFormat')
        .mockReturnValueOnce('<html>some converted html</html>')

      const generatePdfFromHtmlSpy = jest
        .spyOn(ConvertHtmlToPdf, 'generatePdfFromHtml')
        .mockReturnValueOnce(Promise.resolve(Buffer.from('123')))

      // Act
      await StripeController.downloadPaymentInvoice(mockReq, mockRes, jest.fn())
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        mockForm._id,
      )

      // Assert
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(convertInvoiceSpy).toHaveBeenCalledWith(
        expect.any(String),
        mockInvoiceArgs,
      )
      expect(generatePdfFromHtmlSpy).toHaveBeenCalledWith(expect.any(String))
      expect(mockRes.send).toHaveBeenCalledOnce()
      expect(mockRes.status).toHaveBeenCalledWith(200)
    })

    it('should return 404 if StripeService returns error', async () => {
      MockFormService.retrieveFullFormById.mockReturnValue(okAsync(mockForm))
      MockEncryptSubmissionService.checkFormIsEncryptMode.mockReturnValue(
        ok(mockForm as IPopulatedEncryptedForm),
      )

      const mockReq = expressHandler.mockRequest({
        params: { formId: mockForm._id, paymentId: payment._id },
      })
      const mockRes = expressHandler.mockResponse()
      const axiosSpy = jest
        .spyOn(axios, 'get')
        .mockRejectedValueOnce({ data: '<html>missing resource</html>' })

      const convertInvoiceSpy = jest.spyOn(
        StripeUtils,
        'convertToProofOfPaymentFormat',
      )

      const generatePdfFromHtmlSpy = jest.spyOn(
        ConvertHtmlToPdf,
        'generatePdfFromHtml',
      )

      // Act
      await StripeController.downloadPaymentInvoice(mockReq, mockRes, jest.fn())
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        mockForm._id,
      )

      // Assert
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(convertInvoiceSpy).not.toHaveBeenCalled()
      expect(generatePdfFromHtmlSpy).not.toHaveBeenCalled()
      expect(mockRes.json).toHaveBeenCalledOnce()
      expect(mockRes.status).toHaveBeenCalledWith(404)
    })
  })

  describe('downloadReceiptInvoice', () => {
    beforeEach(async () => {
      await dbHandler.clearCollection(Payment.collection.name)
      await dbHandler.clearCollection(EncryptPendingSubmission.collection.name)
    })
    it('should generate return a pdf file when receipt url is present', async () => {
      const pendingSubmission = await EncryptPendingSubmission.create({
        submissionType: SubmissionType.Encrypt,
        form: MOCK_FORM_ID,
        encryptedContent: 'some random encrypted content',
        version: 1,
      })
      const payment = await Payment.create({
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: pendingSubmission._id,
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: 'formsg@tech.gov.sg',
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',
        },
        gstEnabled: false,
      })

      const mockReq = expressHandler.mockRequest({
        params: { formId: 'test@example.com', paymentId: payment._id },
      })
      const mockRes = expressHandler.mockResponse()
      const axiosSpy = jest
        .spyOn(axios, 'get')
        .mockResolvedValueOnce({ data: '<html>>some html</html>' })

      // Act
      await StripeController.downloadPaymentReceipt(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.send).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledOnce()
    })
  })

  describe('_handleConnectOauthCallback', () => {
    beforeEach(async () => {
      await dbHandler.clearCollection(Payment.collection.name)
      await dbHandler.clearCollection(EncryptPendingSubmission.collection.name)
    })
    const mockForm = {
      _id: MOCK_FORM_ID,
    } as IPopulatedForm
    it('should return UNPROCESSABLE_ENTITY when state mismatch', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        query: { state: 'otherState', code: 'someCode' },
        others: { signedCookies: { stripeState: 'anotherState' } },
      })
      const mockRes = expressHandler.mockResponse()
      // Act
      await StripeController._handleConnectOauthCallbackForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid state parameter',
      })
    })

    it('should redirect back to settings/payment page when code is undefined', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        query: { state: 'otherState' },
        others: { signedCookies: { stripeState: 'otherState' } },
      })
      const mockRes = expressHandler.mockResponse()
      // Act
      await StripeController._handleConnectOauthCallbackForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.redirect).toHaveBeenCalledWith(
        `${config.app.appUrl}/admin/form/otherState/settings/payments`,
      )
    })

    it('should redirect back to settings/payment page when stripe account linking is successful', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        query: { state: MOCK_FORM_ID + '.otherState', code: 'someCode' },
        others: {
          signedCookies: { stripeState: MOCK_FORM_ID + '.otherState' },
        },
      })
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(mockForm),
      )
      const mockStripeToken = {
        stripe_user_id: 'user_id',
        stripe_publishable_key: 'publishable_key',
      } as MarkRequired<
        Stripe.OAuthToken,
        'stripe_user_id' | 'stripe_publishable_key'
      >
      MockEncryptSubmissionService.checkFormIsEncryptMode.mockReturnValueOnce(
        ok(mockForm as IPopulatedEncryptedForm),
      )
      MockStripeService.exchangeCodeForAccessToken.mockReturnValueOnce(
        okAsync(mockStripeToken),
      )
      MockStripeService.linkStripeAccountToForm.mockReturnValueOnce(
        okAsync('someId'),
      )
      const mockRes = expressHandler.mockResponse()
      // Act
      await StripeController._handleConnectOauthCallbackForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.redirect).toHaveBeenCalledWith(
        `${config.app.appUrl}/admin/form/${MOCK_FORM_ID}/settings/payments`,
      )
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledOnceWith(
        MOCK_FORM_ID,
      )
      expect(
        MockStripeService.exchangeCodeForAccessToken,
      ).toHaveBeenCalledOnceWith('someCode')
      expect(
        MockStripeService.linkStripeAccountToForm,
      ).toHaveBeenCalledOnceWith(mockForm, {
        accountId: mockStripeToken.stripe_user_id,
        publishableKey: mockStripeToken.stripe_publishable_key,
      })
    })

    it('should redirect back to settings/payment page when DatabaseError occurs', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        query: { state: 'formId.otherState', code: 'someCode' },
        others: {
          signedCookies: { stripeState: 'formId.otherState' },
        },
      })
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        errAsync(new FormNotFoundError()),
      )
      const mockRes = expressHandler.mockResponse()
      // Act
      await StripeController._handleConnectOauthCallbackForTest(
        mockReq,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(mockRes.redirect).toHaveBeenCalledWith(
        `${config.app.appUrl}/admin/form/formId/settings/payments`,
      )
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledOnceWith(
        'formId',
      )
      expect(
        MockStripeService.exchangeCodeForAccessToken,
      ).not.toHaveBeenCalledWith()
      expect(
        MockStripeService.linkStripeAccountToForm,
      ).not.toHaveBeenCalledWith()
    })
  })
})
