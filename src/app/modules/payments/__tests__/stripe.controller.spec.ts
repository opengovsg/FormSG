import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { errAsync, ok, okAsync } from 'neverthrow'
import Stripe from 'stripe'
import { MarkRequired } from 'ts-essentials'

import getPaymentModel from 'src/app/models/payment.server.model'
import { getEncryptPendingSubmissionModel } from 'src/app/models/pending_submission.server.model'
import { IPopulatedEncryptedForm, IPopulatedForm } from 'src/types'

import config from '../../../config/config'
import { FormNotFoundError } from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import * as EncryptSubmissionService from '../../submission/encrypt-submission/encrypt-submission.service'
import * as StripeController from '../stripe.controller'
import * as StripeService from '../stripe.service'

const Payment = getPaymentModel(mongoose)
const EncryptPendingSubmission = getEncryptPendingSubmissionModel(mongoose)

const MOCK_FORM_ID = new ObjectId().toHexString()

jest.mock('src/app/modules/payments/stripe.utils')
jest.mock('src/app/utils/convert-html-to-pdf')

jest.mock(
  'src/app/modules/submission/encrypt-submission/encrypt-submission.service',
)
const MockEncryptSubmissionService = jest.mocked(EncryptSubmissionService)

jest.mock('../../form/form.service')
const MockFormService = jest.mocked(FormService)

jest.mock('src/app/modules/payments/stripe.service', () => {
  const allAutoMocked = jest.createMockFromModule<typeof StripeService>(
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
        query: { state: 'otherStates' },
        others: { signedCookies: { stripeState: 'otherStates' } },
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
        `${config.app.appUrl}/admin/form/otherStates/settings/payments`,
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
      expect(
        MockFormService.retrieveFullFormById,
      ).toHaveBeenCalledExactlyOnceWith(MOCK_FORM_ID)
      expect(
        MockStripeService.exchangeCodeForAccessToken,
      ).toHaveBeenCalledExactlyOnceWith('someCode')
      expect(
        MockStripeService.linkStripeAccountToForm,
      ).toHaveBeenCalledExactlyOnceWith(mockForm, {
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
      expect(
        MockFormService.retrieveFullFormById,
      ).toHaveBeenCalledExactlyOnceWith('formId')
      expect(
        MockStripeService.exchangeCodeForAccessToken,
      ).not.toHaveBeenCalledWith()
      expect(
        MockStripeService.linkStripeAccountToForm,
      ).not.toHaveBeenCalledWith()
    })
  })
})
