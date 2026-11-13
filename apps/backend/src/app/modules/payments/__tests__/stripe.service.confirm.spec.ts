import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import Stripe from 'stripe'

import { stripe } from 'src/app/loaders/stripe'

import {
  PaymentIntentNotConfirmableError,
  StripeCardConfirmationError,
} from '../stripe.errors'
import * as StripeService from '../stripe.service'

const MOCK_STRIPE_ACCOUNT = 'acct_MOCK_ACCOUNT_ID'
const MOCK_PAYMENT_INTENT_ID = 'pi_MOCK_PAYMENT_INTENT'
const MOCK_PAYMENT_METHOD_ID = 'pm_MOCK_PAYMENT_METHOD'
const MOCK_RETURN_URL = 'https://form.example.com/formId/payment/paymentId'
const MOCK_MCC_BY_CARD_BRAND = { mastercard: '5411' }

const mockPaymentIntent = (status: Stripe.PaymentIntent.Status) =>
  ({
    id: MOCK_PAYMENT_INTENT_ID,
    status,
  }) as unknown as Stripe.Response<Stripe.PaymentIntent>

const mockPaymentMethod = (
  type: string,
  cardBrand?: string,
): Stripe.Response<Stripe.PaymentMethod> =>
  ({
    id: MOCK_PAYMENT_METHOD_ID,
    type,
    ...(cardBrand ? { card: { brand: cardBrand } } : {}),
  }) as unknown as Stripe.Response<Stripe.PaymentMethod>

const confirm = () =>
  StripeService.confirmPaymentIntentWithPaymentMethod({
    paymentIntentId: MOCK_PAYMENT_INTENT_ID,
    paymentMethodId: MOCK_PAYMENT_METHOD_ID,
    stripeAccount: MOCK_STRIPE_ACCOUNT,
    mccByCardBrand: MOCK_MCC_BY_CARD_BRAND,
    returnUrl: MOCK_RETURN_URL,
  })

describe('stripe.service: confirmPaymentIntentWithPaymentMethod', () => {
  beforeAll(async () => await dbHandler.connect())
  afterAll(async () => await dbHandler.closeDatabase())
  beforeEach(() => jest.restoreAllMocks())

  it('should confirm with the configured mcc for a card whose brand is configured', async () => {
    jest
      .spyOn(stripe.paymentIntents, 'retrieve')
      .mockResolvedValueOnce(mockPaymentIntent('requires_payment_method'))
    jest
      .spyOn(stripe.paymentMethods, 'retrieve')
      .mockResolvedValueOnce(mockPaymentMethod('card', 'mastercard'))
    const confirmSpy = jest
      .spyOn(stripe.paymentIntents, 'confirm')
      .mockResolvedValueOnce(mockPaymentIntent('succeeded'))

    const result = await confirm()

    expect(result._unsafeUnwrap().status).toBe('succeeded')
    expect(confirmSpy).toHaveBeenCalledWith(
      MOCK_PAYMENT_INTENT_ID,
      expect.objectContaining({
        payment_method: MOCK_PAYMENT_METHOD_ID,
        return_url: MOCK_RETURN_URL,
        payment_method_options: { card: { mcc: '5411' } },
      }),
      expect.objectContaining({ stripeAccount: MOCK_STRIPE_ACCOUNT }),
    )
  })

  it('should confirm without card options for a card whose brand is not configured', async () => {
    jest
      .spyOn(stripe.paymentIntents, 'retrieve')
      .mockResolvedValueOnce(mockPaymentIntent('requires_payment_method'))
    jest
      .spyOn(stripe.paymentMethods, 'retrieve')
      .mockResolvedValueOnce(mockPaymentMethod('card', 'visa'))
    const confirmSpy = jest
      .spyOn(stripe.paymentIntents, 'confirm')
      .mockResolvedValueOnce(mockPaymentIntent('succeeded'))

    const result = await confirm()

    expect(result.isOk()).toBe(true)
    expect(confirmSpy).toHaveBeenCalledWith(
      MOCK_PAYMENT_INTENT_ID,
      expect.not.objectContaining({
        payment_method_options: expect.anything(),
      }),
      expect.objectContaining({ stripeAccount: MOCK_STRIPE_ACCOUNT }),
    )
  })

  it('should confirm without card options for a non-card payment method', async () => {
    jest
      .spyOn(stripe.paymentIntents, 'retrieve')
      .mockResolvedValueOnce(mockPaymentIntent('requires_payment_method'))
    jest
      .spyOn(stripe.paymentMethods, 'retrieve')
      .mockResolvedValueOnce(mockPaymentMethod('paynow'))
    const confirmSpy = jest
      .spyOn(stripe.paymentIntents, 'confirm')
      .mockResolvedValueOnce(mockPaymentIntent('requires_action'))

    const result = await confirm()

    expect(result._unsafeUnwrap().status).toBe('requires_action')
    expect(confirmSpy).toHaveBeenCalledWith(
      MOCK_PAYMENT_INTENT_ID,
      expect.not.objectContaining({
        payment_method_options: expect.anything(),
      }),
      expect.objectContaining({ stripeAccount: MOCK_STRIPE_ACCOUNT }),
    )
  })

  it('should return the intent as-is when it is already beyond collection', async () => {
    jest
      .spyOn(stripe.paymentIntents, 'retrieve')
      .mockResolvedValueOnce(mockPaymentIntent('succeeded'))
    const confirmSpy = jest.spyOn(stripe.paymentIntents, 'confirm')

    const result = await confirm()

    expect(result._unsafeUnwrap().status).toBe('succeeded')
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it('should return PaymentIntentNotConfirmableError for a canceled intent', async () => {
    jest
      .spyOn(stripe.paymentIntents, 'retrieve')
      .mockResolvedValueOnce(mockPaymentIntent('canceled'))
    const confirmSpy = jest.spyOn(stripe.paymentIntents, 'confirm')

    const result = await confirm()

    expect(result._unsafeUnwrapErr()).toBeInstanceOf(
      PaymentIntentNotConfirmableError,
    )
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it('should surface the decline message when the card is declined', async () => {
    jest
      .spyOn(stripe.paymentIntents, 'retrieve')
      .mockResolvedValueOnce(mockPaymentIntent('requires_payment_method'))
    jest
      .spyOn(stripe.paymentMethods, 'retrieve')
      .mockResolvedValueOnce(mockPaymentMethod('card', 'visa'))
    jest.spyOn(stripe.paymentIntents, 'confirm').mockRejectedValueOnce(
      new Stripe.errors.StripeCardError({
        type: 'card_error',
        message: 'Your card was declined.',
      } as Stripe.errors.StripeCardError['raw']),
    )

    const result = await confirm()

    const error = result._unsafeUnwrapErr()
    expect(error).toBeInstanceOf(StripeCardConfirmationError)
    expect(error.message).toBe('Your card was declined.')
  })
})
