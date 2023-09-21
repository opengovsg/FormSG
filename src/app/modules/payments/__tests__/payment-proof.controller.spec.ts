import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import axios from 'axios'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { errAsync, ok, okAsync } from 'neverthrow'
import { PaymentStatus, SubmissionType } from 'shared/types'

import getPaymentModel from 'src/app/models/payment.server.model'
import { getEncryptPendingSubmissionModel } from 'src/app/models/pending_submission.server.model'
import * as ConvertHtmlToPdf from 'src/app/utils/convert-html-to-pdf'
import {
  IPaymentSchema,
  IPopulatedEncryptedForm,
  IPopulatedForm,
} from 'src/types'

import * as FormService from '../../form/form.service'
import * as EncryptSubmissionService from '../../submission/encrypt-submission/encrypt-submission.service'
import * as PaymentProofController from '../payment-proof.controller'
import { PaymentProofUploadS3Error } from '../payment-proof.errors'
import * as PaymentProofService from '../payment-proof.service'
import { StripeFetchError } from '../stripe.errors'
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

    it('should reject when receipt url is not present', async () => {
      // Arrange
      MockFormService.retrieveFullFormById.mockReturnValue(okAsync(mockForm))
      MockEncryptSubmissionService.checkFormIsEncryptMode.mockReturnValue(
        ok(mockForm as IPopulatedEncryptedForm),
      )
      const mockReq = expressHandler.mockRequest({
        params: { formId: mockForm._id, paymentId: payment._id },
      })
      const mockRes = expressHandler.mockResponse()
      const checkStripeReceiptIsReadySpy = jest
        .spyOn(PaymentProofService, 'checkStripeReceiptIsReady')
        .mockReturnValueOnce(
          errAsync(new StripeFetchError('Receipt url not ready')),
        )

      // Act
      await PaymentProofController.downloadPaymentInvoice(
        mockReq,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(checkStripeReceiptIsReadySpy).toHaveBeenCalledOnce()
      expect(mockRes.status).toHaveBeenCalledWith(404)
    })

    it('should reject when receipt download from stripe fails', async () => {
      // Arrange
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
        .mockRejectedValueOnce({ data: 'missing resource' })

      const retrieveReceiptUrlFromStripeSpy = jest
        .spyOn(PaymentProofService, '_retrieveReceiptUrlFromStripe')
        .mockReturnValueOnce(okAsync('http://form.gov.sg'))

      // Act
      await PaymentProofController.downloadPaymentInvoice(
        mockReq,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        mockForm._id,
      )
      expect(retrieveReceiptUrlFromStripeSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(mockRes.status).toHaveBeenCalledWith(404)
    })

    it('should return with error if upload to s3 fails', async () => {
      // Arrange
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

      const retrieveReceiptUrlFromStripeSpy = jest
        .spyOn(PaymentProofService, '_retrieveReceiptUrlFromStripe')
        .mockReturnValueOnce(okAsync('http://form.gov.sg'))

      const storePaymentProofInS3Spy = jest
        .spyOn(PaymentProofService, '_storePaymentProofInS3')
        .mockReturnValueOnce(errAsync(new PaymentProofUploadS3Error()))

      const mockRedirectUrl = 'mockRedirectUrl'
      const getPaymentProofPresignedS3UrlSpy = jest
        .spyOn(PaymentProofService, '_getPaymentProofPresignedS3Url')
        .mockReturnValueOnce(okAsync(mockRedirectUrl))

      // Act
      await PaymentProofController.downloadPaymentInvoice(
        mockReq,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        mockForm._id,
      )
      expect(retrieveReceiptUrlFromStripeSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(convertInvoiceSpy).toHaveBeenCalledOnce()
      expect(generatePdfFromHtmlSpy).toHaveBeenCalledOnce()
      expect(storePaymentProofInS3Spy).toHaveBeenCalledOnce()
      expect(getPaymentProofPresignedS3UrlSpy).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(404)
    })

    it('should return with redirect link', async () => {
      // Arrange
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

      const retrieveReceiptUrlFromStripeSpy = jest
        .spyOn(PaymentProofService, '_retrieveReceiptUrlFromStripe')
        .mockReturnValueOnce(okAsync('http://form.gov.sg'))

      const mockRedirectUrl = 'mockRedirectUrl'
      const getPaymentProofPresignedS3UrlSpy = jest
        .spyOn(PaymentProofService, '_getPaymentProofPresignedS3Url')
        .mockReturnValueOnce(okAsync(mockRedirectUrl))

      // Act
      await PaymentProofController.downloadPaymentInvoice(
        mockReq,
        mockRes,
        jest.fn(),
      )

      // Assert
      expect(MockFormService.retrieveFullFormById).toHaveBeenCalledWith(
        mockForm._id,
      )
      expect(retrieveReceiptUrlFromStripeSpy).toHaveBeenCalledOnce()
      expect(axiosSpy).toHaveBeenCalledOnce()
      expect(convertInvoiceSpy).toHaveBeenCalledOnce()
      expect(generatePdfFromHtmlSpy).toHaveBeenCalledOnce()
      expect(getPaymentProofPresignedS3UrlSpy).toHaveBeenCalledOnce()
      expect(mockRes.redirect).toHaveBeenCalledWith(mockRedirectUrl)
    })
  })
})
