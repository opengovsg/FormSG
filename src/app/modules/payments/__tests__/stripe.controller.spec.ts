import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import axios from 'axios'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { ok, okAsync } from 'neverthrow'
import { PaymentStatus, SubmissionType } from 'shared/types'

import getPaymentModel from 'src/app/models/payment.server.model'
import { getEncryptPendingSubmissionModel } from 'src/app/models/pending_submission.server.model'
import { IPopulatedEncryptedForm, IPopulatedForm } from 'src/types'

import * as FormService from '../../form/form.service'
import * as EncryptSubmissionService from '../../submission/encrypt-submission/encrypt-submission.service'
import * as StripeController from '../stripe.controller'
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
      const mockBusinessInfo = {
        address: 'localhost',
        gstRegNo: 'G123456',
      }
      const mockFormTitle = 'Mock Form Title'
      const mockSubmissionId = 'MOCK_SUBMISSION_ID'
      const mockInvoiceArgs = {
        ...mockBusinessInfo,
        formTitle: mockFormTitle,
        submissionId: mockSubmissionId,
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

      const payment = await Payment.create({
        formId: mockForm._id,
        target_account_id: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: pendingSubmission._id,
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: 'formsg@tech.gov.sg',
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',
          submissionId: mockSubmissionId,
        },
      })
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
        .mockResolvedValueOnce({ data: '<html>>some html</html>' })

      const convertInvoiceSpy = jest.spyOn(
        StripeUtils,
        'convertToInvoiceFormat',
      )

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
      expect(mockRes.send).toHaveBeenCalledOnce()
      expect(mockRes.status).toHaveBeenCalledWith(200)
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
        target_account_id: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: pendingSubmission._id,
        amount: 12345,
        status: PaymentStatus.Succeeded,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: 'formsg@tech.gov.sg',
        completedPayment: {
          receiptUrl: 'http://form.gov.sg',
        },
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
})
