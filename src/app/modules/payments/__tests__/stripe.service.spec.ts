import { ObjectId } from 'bson'
import { keyBy } from 'lodash'
import mongoose, { ClientSession } from 'mongoose'
import { PaymentStatus, SubmissionType } from 'shared/types'
import Stripe from 'stripe'

import { stripe } from 'src/app/loaders/stripe'
import getPaymentModel from 'src/app/models/payment.server.model'
import { getEncryptPendingSubmissionModel } from 'src/app/models/pending_submission.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import { IPaymentSchema } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { PaymentNotFoundError } from '../payments.errors'
import {
  ComputePaymentStateError,
  StripeMetadataPaymentIdInvalidError,
  StripeMetadataPaymentIdNotFoundError,
} from '../stripe.errors'
import * as StripeService from '../stripe.service'

const Payment = getPaymentModel(mongoose)
const EncryptPendingSubmission = getEncryptPendingSubmissionModel(mongoose)
const Submission = getSubmissionModel(mongoose)

const MOCK_PAYMENT_ID = new ObjectId().toHexString()
const MOCK_FORM_ID = new ObjectId().toHexString()

const MOCK_STRIPE_METADATA = {
  paymentId: MOCK_PAYMENT_ID,
  formId: MOCK_FORM_ID,
}

const MOCK_STRIPE_EVENTS = [
  {
    id: 'evt_PAYMENT_INTENT_CREATED',
    created: 1677205503,
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
    created: 1677205563,
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
    created: 1677205563,
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
    id: 'evt_PAYMENT_INTENT_SUCCEEDED',
    created: 1677205663,
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
] as unknown as Stripe.Event[]

const MOCK_STRIPE_EVENTS_MAP = keyBy(MOCK_STRIPE_EVENTS, 'id')

describe('stripe.service', () => {
  beforeAll(async () => await dbHandler.connect())
  afterAll(async () => await dbHandler.closeDatabase())
  beforeEach(() => jest.clearAllMocks())

  describe('processStripeEventTxn', () => {
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
        target_account_id: 'acct_MOCK_ACCOUNT_ID',
        pendingSubmissionId: pendingSubmission._id,
        amount: 12345,
        status: PaymentStatus.Pending,
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
        email: 'formsg@tech.gov.sg',
      })
      await pendingSubmission.updateOne({
        paymentId: payment._id,
      })
    })
    afterEach(() => jest.clearAllMocks())

    it('should update the charge status from Pending to Failed when a charge.failed event is received', async () => {
      // Arrange
      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { paymentIntentId: 'pi_MOCK_PAYMENT_INTENT' },
        {
          webhookLog: [MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED']],
        },
      ).exec()

      // Act
      const eventChargeFailed = MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_FAILED']
      const chargeFailed = eventChargeFailed.data.object as Stripe.Charge
      const result = await StripeService.processStripeEventTxn(
        String(payment._id),
        eventChargeFailed,
        undefined as unknown as ClientSession,
      )

      // Assert
      expect(result.isOk()).toEqual(true)

      const updatedPayment = await Payment.findOne({
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
      })
      if (!updatedPayment) throw new Error('Payment not found!')

      expect(updatedPayment.status).toEqual(PaymentStatus.Failed)
      expect(updatedPayment.chargeIdLatest).toEqual(chargeFailed.id)
    })

    it('should update the charge status from Pending to Succeeded when a charge.succeeded event is received, move the pending submission to submissions', async () => {
      // Arrange
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

      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { paymentIntentId: 'pi_MOCK_PAYMENT_INTENT' },
        {
          webhookLog: [MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED']],
        },
      ).exec()

      // Act
      const eventChargeSucceeded =
        MOCK_STRIPE_EVENTS_MAP['evt_CHARGE_SUCCEEDED']
      const chargeSucceeded = eventChargeSucceeded.data.object as Stripe.Charge
      const result = await StripeService.processStripeEventTxn(
        String(payment._id),
        eventChargeSucceeded,
        undefined as unknown as ClientSession,
      )

      // Assert
      expect(result.isOk()).toEqual(true)
      expect(balanceTransactionApiSpy).toHaveBeenCalledOnce()

      const updatedPayment = await Payment.findOne({
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
      })
      if (!updatedPayment) throw new Error('Payment not found!')

      expect(updatedPayment.status).toEqual(PaymentStatus.Succeeded)
      expect(updatedPayment.chargeIdLatest).toEqual(chargeSucceeded.id)

      expect(updatedPayment.completedPayment).toBeTruthy()
      expect(updatedPayment.completedPayment?.transactionFee).toEqual(
        transactionFee,
      )
      // Expect submission to exist
      expect(updatedPayment.completedPayment?.submissionId).toBeTruthy()
      const submission = await Submission.findById(
        updatedPayment.completedPayment?.submissionId,
      )
      expect(submission).toBeTruthy()
    })

    it('should update the charge status from Succeeded to Partially Refunded when a charge.refunded event is received for a partial refund', async () => {
      // Arrange
      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { paymentIntentId: 'pi_MOCK_PAYMENT_INTENT' },
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
      const result = await StripeService.processStripeEventTxn(
        String(payment._id),
        eventChargePartiallyRefunded,
        undefined as unknown as ClientSession,
      )

      // Assert
      expect(result.isOk()).toEqual(true)

      const updatedPayment = await Payment.findOne({
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
      })
      if (!updatedPayment) throw new Error('Payment not found!')

      expect(updatedPayment.status).toEqual(PaymentStatus.PartiallyRefunded)
      expect(updatedPayment.chargeIdLatest).toEqual(chargePartiallyRefunded.id)
      expect(updatedPayment.completedPayment).toBeTruthy()
    })

    it('should update the charge status from Succeeded to Fully Refunded when a charge.refunded event is received for a full refund', async () => {
      // Arrange
      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { paymentIntentId: 'pi_MOCK_PAYMENT_INTENT' },
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
      const result = await StripeService.processStripeEventTxn(
        String(payment._id),
        eventChargeFullyRefunded,
        undefined as unknown as ClientSession,
      )

      // Assert
      expect(result.isOk()).toEqual(true)

      const updatedPayment = await Payment.findOne({
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
      })
      if (!updatedPayment) throw new Error('Payment not found!')

      expect(updatedPayment.status).toEqual(PaymentStatus.FullyRefunded)
      expect(updatedPayment.chargeIdLatest).toEqual(chargeFullyRefunded.id)
      expect(updatedPayment.completedPayment).toBeTruthy()
    })

    it('should update the charge status from Succeeded to Disputed when a charge.dispute.created event is received', async () => {
      // Arrange
      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { paymentIntentId: 'pi_MOCK_PAYMENT_INTENT' },
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
      const result = await StripeService.processStripeEventTxn(
        String(payment._id),
        eventDispute,
        undefined as unknown as ClientSession,
      )

      // Assert
      expect(result.isOk()).toEqual(true)

      const updatedPayment = await Payment.findOne({
        paymentIntentId: 'pi_MOCK_PAYMENT_INTENT',
      })
      if (!updatedPayment) throw new Error('Payment not found!')

      expect(updatedPayment.status).toEqual(PaymentStatus.Disputed)
      expect(updatedPayment.chargeIdLatest).toEqual(dispute.charge)
      expect(updatedPayment.completedPayment).toBeTruthy()
    })

    it('should return PaymentNotFoundError when the payment cannot be found', async () => {
      // Arrange
      const findSpy = jest.spyOn(Payment, 'findById')
      findSpy.mockImplementationOnce(
        () =>
          ({
            session: jest.fn().mockResolvedValueOnce(null),
          } as unknown as mongoose.Query<any, any>),
      )

      // Act
      const result = await StripeService.processStripeEventTxn(
        String(payment._id),
        MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
        undefined as unknown as ClientSession,
      )

      // Assert
      expect(result.isErr()).toEqual(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(PaymentNotFoundError)
    })

    it('should return DuplicateEventError when it is called twice with two events with identical ids', async () => {
      // Arrange
      // Inject the expected webhook logs and state into the payment object.
      await Payment.updateOne(
        { paymentIntentId: 'pi_MOCK_PAYMENT_INTENT' },
        {
          webhookLog: [MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED']],
        },
      ).exec()

      // Act
      const result = await StripeService.processStripeEventTxn(
        String(payment._id),
        MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
        undefined as unknown as ClientSession,
      )

      // Assert
      expect(result.isErr()).toEqual(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        StripeService.DuplicateEventError,
      )
    })

    it('should return ComputePaymentStateError if there is an error while computing the payment state from webhooks', async () => {
      // Act
      const result = await StripeService.processStripeEventTxn(
        String(payment._id),
        {
          created: 1,
          type: 'charge.dispute.invalid_type',
        } as unknown as Stripe.Event,
        undefined as unknown as ClientSession,
      )

      // Assert
      expect(result.isErr()).toEqual(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(ComputePaymentStateError)
    })
  })

  // Note: We only test cases outside of the mongoose session here, which are all
  // error cases. Branches within the session (which include all the success cases)
  // are tested above, by directly testing processStripeEventTxn.
  describe('processStripeEvent', () => {
    it('should return StripeMetadataPaymentIdNotFoundError when the payment id is missing from the input metadata', async () => {
      // Act
      const result = await StripeService.processStripeEvent(
        { formId: MOCK_FORM_ID },
        MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
      )

      // Assert
      expect(result.isErr()).toEqual(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        StripeMetadataPaymentIdNotFoundError,
      )
    })

    it('should return StripeMetadataPaymentIdInvalidError when the payment id is missing from the input metadata', async () => {
      // Act
      const result = await StripeService.processStripeEvent(
        { paymentId: 'some invalid objectid', formId: MOCK_FORM_ID },
        MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
      )

      // Assert
      expect(result.isErr()).toEqual(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        StripeMetadataPaymentIdInvalidError,
      )
    })

    it('should return DatabaseError when error occurs whilst starting database session', async () => {
      // Arrange
      const startSessionSpy = jest.spyOn(mongoose, 'startSession')
      startSessionSpy.mockImplementationOnce(
        jest.fn().mockRejectedValueOnce(new Error('boom')),
      )

      // Act
      const result = await StripeService.processStripeEvent(
        MOCK_STRIPE_METADATA,
        MOCK_STRIPE_EVENTS_MAP['evt_PAYMENT_INTENT_CREATED'],
      )

      // Assert
      expect(startSessionSpy).toHaveBeenCalledOnce()
      expect(result.isErr()).toEqual(true)
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })
})
