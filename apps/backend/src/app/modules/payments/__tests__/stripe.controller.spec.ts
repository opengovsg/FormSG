import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode, PaymentChannel } from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'
import Stripe from 'stripe'
import { SetRequired } from 'type-fest'

import getPaymentModel from 'src/app/models/payment.server.model'
import { getEncryptPendingSubmissionModel } from 'src/app/models/pending_submission.server.model'
import { IPopulatedForm } from 'src/types'

import config from '../../../config/config'
import { FormNotFoundError } from '../../form/form.errors'
import * as FormService from '../../form/form.service'
import * as PendingSubmissionService from '../../pending-submission/pending-submission.service'
import * as PaymentService from '../payments.service'
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
      responseMode: FormResponseMode.Encrypt,
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
      } as SetRequired<
        Stripe.OAuthToken,
        'stripe_user_id' | 'stripe_publishable_key'
      >
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

  describe('handleConfirmPayment', () => {
    const MOCK_PAYMENT_ID = new ObjectId().toHexString()
    const MOCK_PENDING_SUBMISSION_ID = new ObjectId().toHexString()
    const MOCK_STRIPE_ACCOUNT = 'acct_MOCK_ACCOUNT_ID'
    const MOCK_PAYMENT_METHOD_ID = 'pm_MOCK_PAYMENT_METHOD'
    const MOCK_MCC_BY_CARD_BRAND = { mastercard: '5411' }

    const mockPayment = {
      _id: MOCK_PAYMENT_ID,
      paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
      targetAccountId: MOCK_STRIPE_ACCOUNT,
      pendingSubmissionId: MOCK_PENDING_SUBMISSION_ID,
    }

    const mockFormWithMcc = {
      _id: MOCK_FORM_ID,
      responseMode: FormResponseMode.Encrypt,
      payments_channel: {
        channel: PaymentChannel.Stripe,
        target_account_id: MOCK_STRIPE_ACCOUNT,
        publishable_key: 'pk_MOCK_KEY',
        mcc_by_card_brand: MOCK_MCC_BY_CARD_BRAND,
      },
    } as unknown as IPopulatedForm

    const mockConfirmRequest = (flagValues: Record<string, boolean>) =>
      expressHandler.mockRequest({
        params: { paymentId: MOCK_PAYMENT_ID },
        body: { paymentMethodId: MOCK_PAYMENT_METHOD_ID },
        others: {
          growthbook: {
            getFeatureValue: (flag: string, defaultValue: boolean) =>
              flagValues[flag] ?? defaultValue,
          },
        },
      })

    beforeEach(() => {
      jest
        .spyOn(PaymentService, 'findPaymentById')
        .mockReturnValue(okAsync(mockPayment as any))
      jest
        .spyOn(PendingSubmissionService, 'findPendingSubmissionById')
        .mockReturnValue(okAsync({ form: MOCK_FORM_ID } as any))
      MockFormService.retrieveFullFormById.mockReturnValue(
        okAsync(mockFormWithMcc),
      )
      MockStripeService.confirmPaymentIntentWithPaymentMethod.mockReturnValue(
        okAsync({
          id: 'pi_MOCK_PAYMENT_INTENT',
          status: 'succeeded',
        } as Stripe.PaymentIntent),
      )
    })

    it("should confirm with the form's configured mccs when the feature is enabled", async () => {
      // Arrange
      const mockReq = mockConfirmRequest({
        [featureFlags.paymentServerConfirmation]: true,
        [featureFlags.paymentFormMcc]: true,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await StripeController.handleConfirmPayment(mockReq, mockRes, jest.fn())

      // Assert
      expect(
        MockStripeService.confirmPaymentIntentWithPaymentMethod,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ mccByCardBrand: MOCK_MCC_BY_CARD_BRAND }),
      )
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
    })

    it('should confirm without mccs when the feature is disabled', async () => {
      // Arrange
      const mockReq = mockConfirmRequest({
        [featureFlags.paymentServerConfirmation]: true,
        [featureFlags.paymentFormMcc]: false,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await StripeController.handleConfirmPayment(mockReq, mockRes, jest.fn())

      // Assert
      expect(
        MockStripeService.confirmPaymentIntentWithPaymentMethod,
      ).toHaveBeenCalledWith(expect.objectContaining({ mccByCardBrand: {} }))
    })

    it('should confirm without mccs when the form has none configured', async () => {
      // Arrange
      const formWithoutMcc = {
        ...mockFormWithMcc,
        payments_channel: {
          channel: PaymentChannel.Stripe,
          target_account_id: MOCK_STRIPE_ACCOUNT,
          publishable_key: 'pk_MOCK_KEY',
        },
      } as unknown as IPopulatedForm
      MockFormService.retrieveFullFormById.mockReturnValue(
        okAsync(formWithoutMcc),
      )
      const mockReq = mockConfirmRequest({
        [featureFlags.paymentServerConfirmation]: true,
        [featureFlags.paymentFormMcc]: true,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await StripeController.handleConfirmPayment(mockReq, mockRes, jest.fn())

      // Assert
      expect(
        MockStripeService.confirmPaymentIntentWithPaymentMethod,
      ).toHaveBeenCalledWith(expect.objectContaining({ mccByCardBrand: {} }))
    })
  })
})
