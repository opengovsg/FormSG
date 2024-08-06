/* eslint-disable @typescript-eslint/no-non-null-assertion */
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { keyBy } from 'lodash'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, ResultAsync } from 'neverthrow'
import {
  BasicField,
  PaymentChannel,
  PaymentStatus,
  SubmissionType,
} from 'shared/types'
import Stripe from 'stripe'

import { stripe } from 'src/app/loaders/stripe'
import { getEncryptedFormModel } from 'src/app/models/form.server.model'
import getPaymentModel from 'src/app/models/payment.server.model'
import { getEncryptPendingSubmissionModel } from 'src/app/models/pending_submission.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import {
  IPaymentSchema,
  IPopulatedEncryptedForm,
  IPopulatedUser,
} from 'src/types'

import { InvalidDomainError } from '../../auth/auth.errors'
import * as AuthService from '../../auth/auth.service'
import * as FeatureFlagService from '../../feature-flags/feature-flags.service'
import { PaymentNotFoundError } from '../payments.errors'
import * as PaymentsService from '../payments.service'
import {
  StripeAccountError,
  StripeMetadataInvalidError,
} from '../stripe.errors'
import * as StripeService from '../stripe.service'
import * as StripeUtils from '../stripe.utils'

const Payment = getPaymentModel(mongoose)
const EncryptPendingSubmission = getEncryptPendingSubmissionModel(mongoose)
const Submission = getSubmissionModel(mongoose)
const EncryptedForm = getEncryptedFormModel(mongoose)

const MOCK_PAYMENT_ID = new ObjectId().toHexString()
const MOCK_FORM_ID = new ObjectId().toHexString()

const MOCK_STRIPE_METADATA = {
  paymentId: MOCK_PAYMENT_ID,
  formId: MOCK_FORM_ID,
}

const MOCK_STRIPE_EVENTS = [
  {
    id: 'evt_PAYMENT_INTENT_CREATED',
    object: 'event',
    created: 1677205503,
    account: 'acct_MOCK_ACCOUNT_ID',
    data: {
      object: {
        id: 'pi_MOCK_PAYMENT_INTENT',
        object: 'payment_intent',
        amount: 12345,
        created: 1677205503,
        metadata: MOCK_STRIPE_METADATA,
        status: 'requires_payment_method',
      },
    },
    type: 'payment_intent.created',
  },
  {
    id: 'evt_CHARGE_FAILED',
    object: 'event',
    created: 1677205563,
    account: 'acct_MOCK_ACCOUNT_ID',
    data: {
      object: {
        id: 'ch_MOCK_FAILED_CHARGE',
        object: 'charge',
        amount: 12345,
        created: 1677205562,
        metadata: MOCK_STRIPE_METADATA,
        payment_intent: 'pi_MOCK_PAYMENT_INTENT',
        status: 'failed',
      },
    },
    type: 'charge.failed',
  },
  {
    id: 'evt_PAYMENT_INTENT_FAILED',
    object: 'event',
    created: 1677205563,
    account: 'acct_MOCK_ACCOUNT_ID',
    data: {
      object: {
        id: 'pi_MOCK_PAYMENT_INTENT',
        object: 'payment_intent',
        amount: 12345,
        created: 1677205503,
        latest_charge: 'ch_MOCK_FAILED_CHARGE',
        metadata: MOCK_STRIPE_METADATA,
        status: 'requires_payment_method',
      },
    },
    type: 'payment_intent.payment_failed',
  },
  {
    id: 'evt_PAYMENT_INTENT_CANCELED',
    object: 'event',
    created: 1677205663,
    account: 'acct_MOCK_ACCOUNT_ID',
    data: {
      object: {
        id: 'pi_MOCK_PAYMENT_INTENT',
        object: 'payment_intent',
        amount: 12345,
        created: 1677205503,
        latest_charge: 'ch_MOCK_FAILED_CHARGE',
        metadata: MOCK_STRIPE_METADATA,
        status: 'canceled',
      },
    },
    type: 'payment_intent.canceled',
  },
  {
    id: 'evt_PAYMENT_INTENT_SUCCEEDED',
    object: 'event',
    created: 1677205663,
    account: 'acct_MOCK_ACCOUNT_ID',
    data: {
      object: {
        id: 'pi_MOCK_PAYMENT_INTENT',
        object: 'payment_intent',
        amount: 12345,
        created: 1677205503,
        latest_charge: 'ch_MOCK_SUCCEEDED_CHARGE',
        metadata: MOCK_STRIPE_METADATA,
        status: 'succeeded',
      },
    },
    type: 'payment_intent.succeeded',
  },
  {
    id: 'evt_CHARGE_SUCCEEDED',
    object: 'event',
    created: 1677205663,
    account: 'acct_MOCK_ACCOUNT_ID',
    data: {
      object: {
        id: 'ch_MOCK_SUCCEEDED_CHARGE',
        object: 'charge',
        amount: 12345,
        amount_captured: 12345,
        balance_transaction: 'txn_MOCK_BALANCE_TRANSACTION',
        created: 1677205662,
        metadata: MOCK_STRIPE_METADATA,
        payment_intent: 'pi_MOCK_PAYMENT_INTENT',
        receipt_url: 'https://mock-payment-receipt-from.stripe.com',
        status: 'succeeded',
      },
    },
    type: 'charge.succeeded',
  },
  {
    id: 'evt_CHARGE_PARTIALLY_REFUNDED',
    object: 'event',
    created: 1677205763,
    account: 'acct_MOCK_ACCOUNT_ID',
    data: {
      object: {
        id: 'ch_MOCK_SUCCEEDED_CHARGE',
        object: 'charge',
        amount: 12345,
        amount_captured: 12345,
        amount_refunded: 2345,
        created: 1677205662,
        metadata: MOCK_STRIPE_METADATA,
        payment_intent: 'pi_MOCK_PAYMENT_INTENT',
        status: 'succeeded',
      },
    },
    type: 'charge.refunded',
  },
  {
    id: 'evt_CHARGE_FULLY_REFUNDED',
    object: 'event',
    created: 1677205863,
    account: 'acct_MOCK_ACCOUNT_ID',
    data: {
      object: {
        id: 'ch_MOCK_SUCCEEDED_CHARGE',
        object: 'charge',
        amount: 12345,
        amount_captured: 12345,
        amount_refunded: 12345,
        created: 1677205662,
        metadata: MOCK_STRIPE_METADATA,
        payment_intent: 'pi_MOCK_PAYMENT_INTENT',
        status: 'succeeded',
      },
    },
    type: 'charge.refunded',
  },
  {
    id: 'evt_CHARGE_DISPUTE_CREATED',
    object: 'event',
    created: 1677205963,
    account: 'acct_MOCK_ACCOUNT_ID',
    data: {
      object: {
        id: 'dp_MOCK_DISPUTE',
        object: 'dispute',
        amount: 12345,
        charge: 'ch_MOCK_SUCCEEDED_CHARGE',
        created: 1677205962,
        status: 'warning_needs_response',
      },
    },
    type: 'charge.dispute.created',
  },
  {
    id: 'evt_PAYOUT_CREATED',
    object: 'event',
    created: 1677205973,
    account: 'acct_MOCK_ACCOUNT_ID',
    data: {
      object: {
        id: 'po_MOCK_PAYOUT',
        object: 'payout',
        amount: 12345,
        created: 1677205972,
        status: 'pending',
        arrival_date: 1677215972,
      },
    },
    type: 'payout.created',
  },
  {
    id: 'evt_PAYOUT_CANCELLED',
    object: 'event',
    created: 1677205983,
    account: 'acct_MOCK_ACCOUNT_ID',
    data: {
      object: {
        id: 'po_MOCK_PAYOUT',
        object: 'payout',
        amount: 12345,
        created: 1677205972,
        status: 'canceled',
        arrival_date: 1677215972,
      },
    },
    type: 'payout.canceled',
  },
  {
    id: 'evt_PAYOUT_PAID',
    object: 'event',
    created: 1688972601,
    account: 'acct_MOCK_ACCOUNT_ID',
    data: {
      object: {
        id: 'po_1NS4j4CJpScV6kYOpH4bAqkr',
        object: 'payout',
        amount: 161,
        arrival_date: 1688947200,
        automatic: true,
        balance_transaction: 'txn_1NS4j4CJpScV6kYO6tdVcHWj',
        created: 1688936462,
        currency: 'sgd',
        description: 'STRIPE PAYOUT',
        destination: 'ba_1MogcfCJpScV6kYOtuuO39wX',
        failure_balance_transaction: null,
        failure_code: null,
        failure_message: null,
        livemode: true,
        metadata: {},
        method: 'standard',
        original_payout: null,
        reconciliation_status: 'completed',
        reversed_by: null,
        source_type: 'card',
        statement_descriptor: null,
        status: 'paid',
        type: 'bank_account',
      },
    },
    type: 'payout.paid',
  },
] as unknown as Stripe.DiscriminatedEvent[]

const MOCK_STRIPE_EVENTS_MAP = keyBy(MOCK_STRIPE_EVENTS, 'id')

const MOCK_USER_ID = new ObjectId()
const MOCK_USER = {
  _id: MOCK_USER_ID,
  email: 'somerandom@example.com',
} as IPopulatedUser

describe('stripe.service', () => {
  beforeAll(async () => await dbHandler.connect())
  afterAll(async () => await dbHandler.closeDatabase())
  beforeEach(() => jest.clearAllMocks())

  describe('processStripeEvent', () => {
    let payment: IPaymentSchema

    beforeEach(async () => {
      await dbHandler.clearCollection(Payment.collection.name)
      await dbHandler.clearCollection(EncryptPendingSubmission.collection.name)
      await dbHandler.clearCollection(Submission.collection.name)

      // Arrange
      // Create a new pending submission and payment
      const pendingSubmission = await EncryptPendingSubmission.create({
        submissionType: SubmissionType.Encrypt,
        form: MOCK_FORM_ID,
        encryptedContent: 'some random encrypted content',
        version: 1,
        responseHash: 'hash',
        responseSalt: 'salt',
      })
      payment = await Payment.create({
        formId: MOCK_FORM_ID,
        targetAccountId: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: pendingSubmission._id,
        amount: 12345,
        status: PaymentStatus.Pending,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: 'formsg@tech.gov.sg',
        gstEnabled: false,
      })
      await pendingSubmission.updateOne({
        paymentId: payment._id,
      })

      // Calls to processStripeEvent should skip the transaction handler steps
      // and directly into the main body of the function.
      jest
        .spyOn(StripeService, 'processStripeEvent')
        .mockImplementationOnce((paymentId, event) =>
          StripeService.processStripeEventWithinSession(
            paymentId,
            event,
            null as unknown as mongoose.ClientSession,
          ),
        )
    })
    afterEach(() => jest.clearAllMocks())

    it('should update the payment status from Pending to Failed when a charge.failed event is received', async () => {
      // Arrange
      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { _id: payment._id },
        {
          webhookLog: [MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED']],
        },
      ).exec()

      // Act
      const eventChargeFailed = MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_FAILED']
      const chargeFailed = eventChargeFailed.data.object as Stripe.Charge
      const result = await StripeService.processStripeEvent(
        String(payment._id),
        eventChargeFailed,
      )

      // Assert
      expect(result.isOk()).toEqual(true)

      const updatedPayment = await Payment.findById(payment.id)
      expect(updatedPayment).toBeTruthy()

      expect(updatedPayment!.status).toEqual(PaymentStatus.Failed)
      expect(updatedPayment!.chargeIdLatest).toEqual(chargeFailed.id)
    })

    it('should update the payment status from Pending to Canceled when a payment_intent.canceled event is received', async () => {
      // Arrange
      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { _id: payment._id },
        {
          webhookLog: [
            MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
            MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_FAILED'],
            MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_FAILED'],
          ],
        },
      ).exec()

      // Act
      const eventPaymentIntentCanceled =
        MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CANCELED']
      const paymentIntentCanceled = eventPaymentIntentCanceled.data
        .object as Stripe.PaymentIntent
      const result = await StripeService.processStripeEvent(
        String(payment._id),
        eventPaymentIntentCanceled,
      )

      // Assert
      expect(result.isOk()).toEqual(true)

      const updatedPayment = await Payment.findById(payment.id)
      expect(updatedPayment).toBeTruthy()

      expect(updatedPayment!.status).toEqual(PaymentStatus.Canceled)
      expect(updatedPayment!.chargeIdLatest).toEqual(
        paymentIntentCanceled.latest_charge,
      )
    })

    it('should update the payment status from Pending to Succeeded when a charge.succeeded event is received, move the pending submission to submissions', async () => {
      // Arrange
      // Mock Stripe API
      const transactionFee = 10
      const balanceTransactionApiSpy = jest.spyOn(
        stripe.balanceTransactions,
        'retrieve',
      )
      balanceTransactionApiSpy.mockImplementationOnce((id) =>
        Promise.resolve({
          id,
          fee_details: [{ type: 'stripe_fee', amount: transactionFee }],
        } as unknown as Stripe.Response<Stripe.BalanceTransaction>),
      )

      // Mock confirmation service
      const confirmSpy = jest.spyOn(
        PaymentsService,
        'confirmPaymentPendingSubmission',
      )
      confirmSpy.mockImplementationOnce((paymentId) =>
        ResultAsync.fromSafePromise(
          Payment.findById(paymentId) as mongoose.Query<IPaymentSchema, any>,
        ),
      )

      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { _id: payment._id },
        {
          webhookLog: [MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED']],
        },
      ).exec()

      // Act
      const eventChargeSucceeded =
        MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_SUCCEEDED']
      const chargeSucceeded = eventChargeSucceeded.data.object as Stripe.Charge
      const result = await StripeService.processStripeEvent(
        String(payment._id),
        eventChargeSucceeded,
      )

      // Assert
      expect(result.isOk()).toEqual(true)
      expect(balanceTransactionApiSpy).toHaveBeenCalledOnce()
      expect(confirmSpy).toHaveBeenCalledOnce()

      const updatedPayment = await Payment.findById(payment.id)
      expect(updatedPayment).toBeTruthy()

      expect(updatedPayment!.status).toEqual(PaymentStatus.Succeeded)
      expect(updatedPayment!.chargeIdLatest).toEqual(chargeSucceeded.id)
    })

    it('should update the payment status from Succeeded to Partially Refunded when a charge.refunded event is received for a partial refund', async () => {
      // Arrange
      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { _id: payment._id },
        {
          webhookLog: [
            MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
            MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_SUCCEEDED'],
            MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_SUCCEEDED'],
          ],
          status: PaymentStatus.Succeeded,
          completedPayment: {
            // Random mock data
            paymentDate: new Date(),
            submissionId: new ObjectId().toHexString(),
            transactionFee: 10,
            receiptUrl: 'https://mock-receipt-url.stripe.com',
          },
        },
      ).exec()

      // Act
      const eventChargePartiallyRefunded =
        MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_PARTIALLY_REFUNDED']
      const chargePartiallyRefunded = eventChargePartiallyRefunded.data
        .object as Stripe.Charge
      const result = await StripeService.processStripeEvent(
        String(payment._id),
        eventChargePartiallyRefunded,
      )

      // Assert
      expect(result.isOk()).toEqual(true)

      const updatedPayment = await Payment.findById(payment.id)
      expect(updatedPayment).toBeTruthy()

      expect(updatedPayment!.status).toEqual(PaymentStatus.PartiallyRefunded)
      expect(updatedPayment!.chargeIdLatest).toEqual(chargePartiallyRefunded.id)
      expect(updatedPayment!.completedPayment).toBeTruthy()
    })

    it('should update the payment status from Succeeded to Fully Refunded when a charge.refunded event is received for a full refund', async () => {
      // Arrange
      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { _id: payment._id },
        {
          webhookLog: [
            MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
            MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_SUCCEEDED'],
            MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_SUCCEEDED'],
          ],
          status: PaymentStatus.Succeeded,
          completedPayment: {
            // Random mock data
            paymentDate: new Date(),
            submissionId: new ObjectId().toHexString(),
            transactionFee: 10,
            receiptUrl: 'https://mock-receipt-url.stripe.com',
          },
        },
      ).exec()

      // Act
      const eventChargeFullyRefunded =
        MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_FULLY_REFUNDED']
      const chargeFullyRefunded = eventChargeFullyRefunded.data
        .object as Stripe.Charge
      const result = await StripeService.processStripeEvent(
        String(payment._id),
        eventChargeFullyRefunded,
      )

      // Assert
      expect(result.isOk()).toEqual(true)

      const updatedPayment = await Payment.findById(payment.id)
      expect(updatedPayment).toBeTruthy()

      expect(updatedPayment!.status).toEqual(PaymentStatus.FullyRefunded)
      expect(updatedPayment!.chargeIdLatest).toEqual(chargeFullyRefunded.id)
      expect(updatedPayment!.completedPayment).toBeTruthy()
    })

    it('should update the payment status from Succeeded to Disputed when a charge.dispute.created event is received', async () => {
      // Arrange
      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { _id: payment._id },
        {
          webhookLog: [
            MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
            MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_SUCCEEDED'],
            MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_SUCCEEDED'],
          ],
          status: PaymentStatus.Succeeded,
          completedPayment: {
            // Random mock data
            paymentDate: new Date(),
            submissionId: new ObjectId().toHexString(),
            transactionFee: 10,
            receiptUrl: 'https://mock-receipt-url.stripe.com',
          },
        },
      ).exec()

      // Act
      const eventDispute = MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_DISPUTE_CREATED']
      const dispute = eventDispute.data.object as Stripe.Dispute
      const result = await StripeService.processStripeEvent(
        String(payment._id),
        eventDispute,
      )

      // Assert
      expect(result.isOk()).toEqual(true)

      const updatedPayment = await Payment.findById(payment.id)
      expect(updatedPayment).toBeTruthy()

      expect(updatedPayment!.status).toEqual(PaymentStatus.Disputed)
      expect(updatedPayment!.chargeIdLatest).toEqual(dispute.charge)
      expect(updatedPayment!.completedPayment).toBeTruthy()
    })

    it('should add the payout details when a payout.created event is received', async () => {
      // Arrange
      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { _id: payment._id },
        {
          webhookLog: [
            MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
            MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_SUCCEEDED'],
            MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_SUCCEEDED'],
          ],
          status: PaymentStatus.Succeeded,
        },
      ).exec()

      // Act
      const eventPayout = MOCK_STRIPE_EVENTS_MAP['evt_PAYOUT_CREATED']
      const payout = eventPayout.data.object as Stripe.Payout
      const result = await StripeService.processStripeEvent(
        String(payment._id),
        eventPayout,
      )

      // Assert
      expect(result.isOk()).toEqual(true)

      const updatedPayment = await Payment.findById(payment.id)
      expect(updatedPayment).toBeTruthy()

      expect(updatedPayment!.payout).toBeTruthy()
      expect(updatedPayment!.payout?.payoutId).toEqual(payout.id)
    })

    it('should remove the payout details when a payout.cancelled event is received', async () => {
      // Arrange
      const payoutCreatedEvent = MOCK_STRIPE_EVENTS_MAP['evt_PAYOUT_CREATED']
      const payoutCreated = payoutCreatedEvent.data.object as Stripe.Payout

      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { _id: payment._id },
        {
          webhookLog: [
            MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
            MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_SUCCEEDED'],
            MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_SUCCEEDED'],
            payoutCreatedEvent,
          ],
          status: PaymentStatus.Succeeded,
          payout: {
            payoutDate: new Date(payoutCreated.arrival_date * 1000),
            payoutId: payoutCreated.id,
          },
        },
      ).exec()

      // Act
      const result = await StripeService.processStripeEvent(
        String(payment._id),
        MOCK_STRIPE_EVENTS_MAP['evt_PAYOUT_CANCELLED'],
      )

      // Assert
      expect(result.isOk()).toEqual(true)

      const updatedPayment = await Payment.findById(payment.id)
      expect(updatedPayment).toBeTruthy()

      expect(updatedPayment!.payout).toBeUndefined()
    })

    it('should return PaymentNotFoundError when the payment cannot be found', async () => {
      // Arrange
      const findSpy = jest.spyOn(Payment, 'findById')
      findSpy.mockImplementationOnce(jest.fn().mockResolvedValueOnce(null))

      // Act
      const result = await StripeService.processStripeEvent(
        String(payment._id),
        MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
      )

      // Assert
      expect(findSpy).toHaveBeenCalledOnce()
      expect(result.isErr()).toEqual(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(PaymentNotFoundError)
    })

    it('should return DatabaseError when error occurs while querying database', async () => {
      // Arrange
      const findSpy = jest.spyOn(Payment, 'findById')
      findSpy.mockImplementationOnce(
        jest.fn().mockRejectedValueOnce(new Error('boom')),
      )

      // Act
      const result = await StripeService.processStripeEvent(
        payment._id,
        MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
      )

      // Assert
      expect(findSpy).toHaveBeenCalledOnce()
      expect(result.isErr()).toEqual(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })
  describe('linkStripeAccountToForm', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    it('should attach payment account information for new accounts', async () => {
      // Arrange
      await dbHandler.insertFormCollectionReqs({
        userId: MOCK_USER_ID,
      })
      const mockForm = (await new EncryptedForm({
        admin: MOCK_USER,
        title: 'Test Form',
        publicKey: 'mockPublicKey',
      }).populate('admin')) as IPopulatedEncryptedForm

      const getFeatureFlagSpy = jest
        .spyOn(FeatureFlagService, 'getFeatureFlag')
        .mockReturnValueOnce(okAsync(true))
      const addPaymentAccountIdSpy = jest.spyOn(mockForm, 'addPaymentAccountId')
      const expectedAccountId = 'newAccountId'
      const stripeAccountsRetrieveApiSpy = jest
        .spyOn(stripe.accounts, 'retrieve')
        .mockReturnValueOnce(
          Promise.resolve({
            email: 'mockEmail',
          } as unknown as Stripe.Response<Stripe.Account>),
        )
      const authServiceSpy = jest
        .spyOn(AuthService, 'validateEmailDomain')
        .mockReturnValue(okAsync(true) as any)

      // Act
      const result = await StripeService.linkStripeAccountToForm(mockForm, {
        accountId: expectedAccountId,
        publishableKey: 'publishableKey',
      })

      // Assert
      expect(getFeatureFlagSpy).toHaveBeenCalledTimes(1)
      expect(stripeAccountsRetrieveApiSpy).toHaveBeenCalledTimes(1)
      expect(authServiceSpy).toHaveBeenCalledTimes(1)
      expect(addPaymentAccountIdSpy).toHaveBeenCalledTimes(1)
      expect(result._unsafeUnwrap()).toBe(expectedAccountId)
    })

    it('should return existing account information when called with new account to be linked', async () => {
      // Arrange
      const mockForm = (await new EncryptedForm({
        admin: MOCK_USER,
        title: 'Test Form',
        publicKey: 'mockPublicKey',
      }).populate('admin')) as IPopulatedEncryptedForm

      const getFeatureFlagSpy = jest
        .spyOn(FeatureFlagService, 'getFeatureFlag')
        .mockReturnValueOnce(okAsync(true))
      const expectedAccountId = 'existingAccountId'
      mockForm.payments_channel = {
        target_account_id: expectedAccountId,
        channel: PaymentChannel.Stripe,
        publishable_key: 'publishableKey',
      }
      const stripeAccountsRetrieveApiSpy = jest
        .spyOn(stripe.accounts, 'retrieve')
        .mockReturnValueOnce(
          Promise.resolve({
            email: 'mockEmail',
          } as unknown as Stripe.Response<Stripe.Account>),
        )
      const authServiceSpy = jest
        .spyOn(AuthService, 'validateEmailDomain')
        .mockReturnValue(okAsync(true) as any)

      // Act
      const result = await StripeService.linkStripeAccountToForm(mockForm, {
        accountId: 'anotherAccountId',
        publishableKey: 'anotherPublishableKey',
      })

      // Assert
      expect(getFeatureFlagSpy).toHaveBeenCalledTimes(1)
      expect(result._unsafeUnwrap()).toBe(expectedAccountId)
      expect(stripeAccountsRetrieveApiSpy).toHaveBeenCalledTimes(1)
      expect(authServiceSpy).toHaveBeenCalledTimes(1)
    })

    it('should not connect when stripe account email is not whitelisted', async () => {
      // Arrange
      const mockForm = (await new EncryptedForm({
        admin: MOCK_USER,
        title: 'Test Form',
        publicKey: 'mockPublicKey',
      })) as IPopulatedEncryptedForm
      const addPaymentAccountIdSpy = jest.spyOn(mockForm, 'addPaymentAccountId')

      const getFeatureFlagSpy = jest
        .spyOn(FeatureFlagService, 'getFeatureFlag')
        .mockReturnValueOnce(okAsync(true))
      const stripeAccountsRetrieveApiSpy = jest
        .spyOn(stripe.accounts, 'retrieve')
        .mockReturnValueOnce(
          Promise.resolve({
            email: 'mockEmail',
          } as unknown as Stripe.Response<Stripe.Account>),
        )
      const authServiceSpy = jest
        .spyOn(AuthService, 'validateEmailDomain')
        .mockReturnValue(errAsync(new InvalidDomainError()))

      // Act
      const result = await StripeService.linkStripeAccountToForm(mockForm, {
        accountId: 'accountId',
        publishableKey: 'publishableKey',
      })

      // Assert
      expect(getFeatureFlagSpy).toHaveBeenCalledTimes(1)
      expect(stripeAccountsRetrieveApiSpy).toHaveBeenCalledTimes(1)
      expect(authServiceSpy).toHaveBeenCalledTimes(1)
      expect(addPaymentAccountIdSpy).toHaveBeenCalledTimes(0)
      expect(result.isErr()).toBeTrue()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(InvalidDomainError)
    })

    it('should not check email whitelisting if feature flag is disabled', async () => {
      // Arrange
      const mockForm = (await new EncryptedForm({
        admin: MOCK_USER,
        title: 'Test Form',
        publicKey: 'mockPublicKey',
      }).populate('admin')) as IPopulatedEncryptedForm

      const getFeatureFlagSpy = jest
        .spyOn(FeatureFlagService, 'getFeatureFlag')
        .mockReturnValueOnce(okAsync(false))
      const addPaymentAccountIdSpy = jest.spyOn(mockForm, 'addPaymentAccountId')
      const stripeAccountsRetrieveApiSpy = jest.spyOn(
        stripe.accounts,
        'retrieve',
      )
      const authServiceSpy = jest.spyOn(AuthService, 'validateEmailDomain')

      // Act
      const result = await StripeService.linkStripeAccountToForm(mockForm, {
        accountId: 'accountId',
        publishableKey: 'publishableKey',
      })

      // Assert
      expect(getFeatureFlagSpy).toHaveBeenCalledTimes(1)
      expect(stripeAccountsRetrieveApiSpy).toHaveBeenCalledTimes(0)
      expect(authServiceSpy).toHaveBeenCalledTimes(0)
      expect(addPaymentAccountIdSpy).toHaveBeenCalledTimes(1)
      expect(result.isOk()).toBeTrue()
    })

    it('should not connect stripe account when form has email fields with pdf summary enabled', async () => {
      // Arrange
      const mockForm = (await new EncryptedForm({
        admin: MOCK_USER,
        title: 'Test Form',
        publicKey: 'mockPublicKey',
        form_fields: [
          {
            _id: new mongoose.Types.ObjectId(),
            fieldType: BasicField.Email,
            title: 'Email Field',
            autoReplyOptions: {
              hasAutoReply: true,
              includeFormSummary: true,
            },
          },
        ],
      }).populate('admin')) as IPopulatedEncryptedForm

      const getFeatureFlagSpy = jest
        .spyOn(FeatureFlagService, 'getFeatureFlag')
        .mockReturnValueOnce(okAsync(true))
      const addPaymentAccountIdSpy = jest.spyOn(mockForm, 'addPaymentAccountId')
      const stripeAccountsRetrieveApiSpy = jest
        .spyOn(stripe.accounts, 'retrieve')
        .mockReturnValueOnce(
          Promise.resolve({
            email: 'mockEmail',
          } as unknown as Stripe.Response<Stripe.Account>),
        )
      const authServiceSpy = jest
        .spyOn(AuthService, 'validateEmailDomain')
        .mockReturnValue(okAsync(true) as any)

      // Act
      const result = await StripeService.linkStripeAccountToForm(mockForm, {
        accountId: 'accountId',
        publishableKey: 'publishableKey',
      })

      // Assert
      expect(getFeatureFlagSpy).toHaveBeenCalledTimes(0)
      expect(stripeAccountsRetrieveApiSpy).toHaveBeenCalledTimes(0)
      expect(authServiceSpy).toHaveBeenCalledTimes(0)
      expect(addPaymentAccountIdSpy).not.toHaveBeenCalled()
      expect(result.isErr()).toBeTrue()
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(StripeAccountError)
      expect(result._unsafeUnwrapErr().message).toBe(
        'Email fields with pdf summary is not allowed',
      )
    })
  })

  describe('handleStripeEvent', () => {
    describe('with event.type of payout', () => {
      beforeEach(() => jest.restoreAllMocks())

      it('should return error result when call to stripe.balanceTransactions failed', async () => {
        const balanceTransactionApiSpy = jest
          .spyOn(stripe.balanceTransactions, 'list')
          .mockImplementationOnce(
            () =>
              ({
                autoPagingEach: () => Promise.reject('boom'),
              }) as unknown as Stripe.ApiListPromise<Stripe.BalanceTransaction>,
          )
        const processStripeEventSpy = jest.spyOn(
          StripeService,
          'processStripeEvent',
        )

        const result = await StripeService.handleStripeEvent(
          MOCK_STRIPE_EVENTS_MAP['evt_PAYOUT_CREATED'],
        )
        expect(balanceTransactionApiSpy).toHaveBeenCalledOnce()
        expect(processStripeEventSpy).not.toHaveBeenCalled()
        expect(result.isErr()).toBeTrue()
      })

      it('should return error result when call to getMetadataPaymentId failed', async () => {
        const balanceTransactionApiSpy = jest
          .spyOn(stripe.balanceTransactions, 'list')
          .mockImplementationOnce(
            () =>
              ({
                autoPagingEach: (fn) => fn({ type: 'charge', source: {} }),
              }) as unknown as Stripe.ApiListPromise<Stripe.BalanceTransaction>,
          )
        const getMetadataPaymentIdSpy = jest
          .spyOn(StripeUtils, 'getMetadataPaymentId')
          .mockImplementation(() => err(new StripeMetadataInvalidError()))
        const processStripeEventSpy = jest.spyOn(
          StripeService,
          'processStripeEvent',
        )

        const result = await StripeService.handleStripeEvent(
          MOCK_STRIPE_EVENTS_MAP['evt_PAYOUT_CREATED'],
        )

        expect(balanceTransactionApiSpy).toHaveBeenCalledOnce()
        expect(getMetadataPaymentIdSpy).toHaveBeenCalledOnce()
        expect(processStripeEventSpy).not.toHaveBeenCalledOnce()
        expect(result.isErr()).toBeTrue()
      })

      it('should return error result when call to processStripeEvent failed', async () => {
        const balanceTransactionApiSpy = jest
          .spyOn(stripe.balanceTransactions, 'list')
          .mockImplementationOnce(
            () =>
              ({
                autoPagingEach: (fn) => fn({ type: 'charge', source: {} }),
              }) as unknown as Stripe.ApiListPromise<Stripe.BalanceTransaction>,
          )
        const getMetadataPaymentIdSpy = jest
          .spyOn(StripeUtils, 'getMetadataPaymentId')
          .mockImplementation(() => ok('still gud'))
        const processStripeEventSpy = jest
          .spyOn(StripeService, 'processStripeEvent')
          .mockImplementationOnce(() => errAsync(new PaymentNotFoundError()))

        const result = await StripeService.handleStripeEvent(
          MOCK_STRIPE_EVENTS_MAP['evt_PAYOUT_CREATED'],
        )

        expect(balanceTransactionApiSpy).toHaveBeenCalledOnce()
        expect(getMetadataPaymentIdSpy).toHaveBeenCalledOnce()
        expect(processStripeEventSpy).toHaveBeenCalledOnce()
        expect(result.isErr()).toBeTrue()
      })

      it('should return ok result when there are no internal errors', async () => {
        const balanceTransactionApiSpy = jest
          .spyOn(stripe.balanceTransactions, 'list')
          .mockImplementationOnce(
            () =>
              ({
                autoPagingEach: (fn) => fn({ type: 'charge', source: {} }),
              }) as unknown as Stripe.ApiListPromise<Stripe.BalanceTransaction>,
          )
        const getMetadataPaymentIdSpy = jest
          .spyOn(StripeUtils, 'getMetadataPaymentId')
          .mockImplementation(() => ok('still gud'))
        const processStripeEventSpy = jest
          .spyOn(StripeService, 'processStripeEvent')
          .mockImplementationOnce(() => okAsync(undefined))

        const result = await StripeService.handleStripeEvent(
          MOCK_STRIPE_EVENTS_MAP['evt_PAYOUT_CREATED'],
        )

        expect(balanceTransactionApiSpy).toHaveBeenCalledOnce()
        expect(getMetadataPaymentIdSpy).toHaveBeenCalledOnce()
        expect(processStripeEventSpy).toHaveBeenCalledOnce()
        expect(result.isOk()).toBeTrue()
      })

      describe('with event.type of payout.paid', () => {
        const chargesResponseType = {
          type: 'charge',
          amount: 53,
          status: 'succeeded',
          source: {
            object: 'charge',
            amount: 53,
            amount_captured: 53,
            payment_method_details: {
              card: {
                brand: 'visa',
                checks: {
                  address_line1_check: null,
                  address_postal_code_check: null,
                  cvc_check: 'pass',
                },
                country: 'SG',
                exp_month: 12,
                exp_year: 2024,
                fingerprint: 'fingerprint',
                funding: 'prepaid',
                installments: null,
                last4: '1234',
                mandate: null,
                network: 'visa',
                network_token: {
                  used: false,
                },
                three_d_secure: null,
                wallet: null,
              },
              type: 'card',
            },
          },
        } as Stripe.BalanceTransaction

        const paymentResponseType = {
          type: 'payment',
          amount: 110,
          status: 'succeeded',
          source: {
            id: 'py_3NR4JHCJpScV6kYO1UnwVvkM',
            object: 'charge',
            amount: 110,
            amount_captured: 110,
            payment_method_details: {
              paynow: {
                reference: '3NR4JHCJpScV6kYO1IZnPfoW',
              },
              type: 'paynow',
            },
          },
        } as Stripe.BalanceTransaction

        const payoutResponseType = {
          type: 'payout',
          amount: -161,
          status: 'available',
          source: {
            id: 'po_1NS4j4CJpScV6kYOpH4bAqkr',
            object: 'payout',
            amount: 161,
            arrival_date: 1688947200,
            automatic: true,
            balance_transaction: 'txn_1NS4j4CJpScV6kYO6tdVcHWj',
            created: 1688936462,
            currency: 'sgd',
            description: 'STRIPE PAYOUT',
            destination: 'ba_DESTINATION',
            failure_balance_transaction: null,
            failure_code: null,
            failure_message: null,
            livemode: true,
            metadata: {},
            method: 'standard',
            original_payout: null,
            reconciliation_status: 'completed',
            reversed_by: null,
            source_type: 'card',
            statement_descriptor: null,
            status: 'paid',
            type: 'bank_account',
          },
        } as Stripe.BalanceTransaction

        let createBalanceTransactionApiSpy: (
          balanceTransactions: Array<Stripe.BalanceTransaction>,
        ) => jest.SpyInstance<Stripe.ApiListPromise<Stripe.BalanceTransaction>>
        let getMetadataPaymentIdSpy: jest.SpyInstance
        let processStripeEventSpy: jest.SpyInstance

        beforeEach(() => {
          createBalanceTransactionApiSpy = (
            balanceTransactionResponses: Array<Stripe.BalanceTransaction>,
          ) =>
            jest
              .spyOn(stripe.balanceTransactions, 'list')
              .mockImplementationOnce(
                () =>
                  ({
                    autoPagingEach: (fn) => {
                      balanceTransactionResponses.forEach((resp) => {
                        if (!fn(resp)) return Promise.reject('fail case')
                      })
                      return Promise.resolve('pass')
                    },
                  }) as unknown as Stripe.ApiListPromise<Stripe.BalanceTransaction>,
              )
          getMetadataPaymentIdSpy = jest
            .spyOn(StripeUtils, 'getMetadataPaymentId')
            .mockImplementation(() => ok('still gud'))
          processStripeEventSpy = jest
            .spyOn(StripeService, 'processStripeEvent')
            .mockImplementationOnce(() => okAsync(undefined))
        })

        it('should not process payout transactions', async () => {
          // Arrange
          const balanceTransactionResponses = [
            payoutResponseType,
            payoutResponseType,
          ]
          const balanceTransactionApiSpy = createBalanceTransactionApiSpy(
            balanceTransactionResponses,
          )

          // Act
          const result = await StripeService.handleStripeEvent(
            MOCK_STRIPE_EVENTS_MAP['evt_PAYOUT_PAID'],
          )

          // Assert
          expect(balanceTransactionApiSpy).toHaveBeenCalledOnce()
          expect(getMetadataPaymentIdSpy).toHaveBeenCalledTimes(0)
          expect(processStripeEventSpy).toHaveBeenCalledTimes(0)
          expect(result.isOk()).toBeTrue()
        })

        it('should ignore only payout transactions', async () => {
          // Arrange
          const balanceTransactionResponses = [
            payoutResponseType,
            chargesResponseType,
            paymentResponseType,
          ]
          const balanceTransactionApiSpy = createBalanceTransactionApiSpy(
            balanceTransactionResponses,
          )
          // excluding payout type
          const expectedCallCount = balanceTransactionResponses.filter(
            (resp) => resp.type !== 'payout',
          ).length

          // Act
          const result = await StripeService.handleStripeEvent(
            MOCK_STRIPE_EVENTS_MAP['evt_PAYOUT_PAID'],
          )

          // Assert
          expect(balanceTransactionApiSpy).toHaveBeenCalledOnce()
          expect(getMetadataPaymentIdSpy).toHaveBeenCalledTimes(
            expectedCallCount,
          )
          expect(processStripeEventSpy).toHaveBeenCalledTimes(expectedCallCount)
          expect(result.isOk()).toBeTrue()
        })

        it('should process all bank cards and paynow transactions', async () => {
          // Arrange
          const balanceTransactionResponses = [
            chargesResponseType,
            paymentResponseType,
          ]
          const balanceTransactionApiSpy = createBalanceTransactionApiSpy(
            balanceTransactionResponses,
          )

          // Act
          const result = await StripeService.handleStripeEvent(
            MOCK_STRIPE_EVENTS_MAP['evt_PAYOUT_PAID'],
          )

          // Assert
          expect(balanceTransactionApiSpy).toHaveBeenCalledOnce()
          expect(getMetadataPaymentIdSpy).toHaveBeenCalledTimes(
            balanceTransactionResponses.length,
          )
          expect(processStripeEventSpy).toHaveBeenCalledTimes(
            balanceTransactionResponses.length,
          )
          expect(result.isOk()).toBeTrue()
        })
      })
    })
  })
})
