import { ObjectId } from 'bson'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'

import config from 'src/app/config/config'

import {
  MalformedStripeChargeObjectError,
  MalformedStripeEventObjectError,
  StripeMetadataIncorrectEnvError,
  StripeMetadataInvalidError,
  StripeMetadataNotFormsgError,
  StripeMetadataValidPaymentIdNotFoundError,
} from '../stripe.errors'
import { getMetadataPaymentId, mapRouteError } from '../stripe.utils'

jest.mock('src/app/config/config')
const MockConfig = jest.mocked(config)

const MOCK_ENV = 'test'
const MOCK_PAYMENT_ID = new ObjectId().toHexString()

const buildFormsgMetadata = (
  overrides: Partial<Stripe.Metadata> = {},
): Stripe.Metadata => ({
  env: MOCK_ENV,
  formTitle: 'mock form title',
  formId: new ObjectId().toHexString(),
  submissionId: new ObjectId().toHexString(),
  paymentId: MOCK_PAYMENT_ID,
  paymentContactEmail: 'mock@example.com',
  ...overrides,
})

describe('stripe.utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    MockConfig.envSiteName = MOCK_ENV
  })

  describe('getMetadataPaymentId', () => {
    describe('non-FormSG Stripe events', () => {
      it('should return StripeMetadataNotFormsgError when metadata is missing the FormSG env marker', () => {
        // Arrange: metadata that did not originate from FormSG (e.g. another
        // integration using the same Stripe account directly).
        const nonFormsgMetadata: Stripe.Metadata = {
          customer_id: 'cus_external',
          source: 'external-integration',
        }

        // Act
        const result = getMetadataPaymentId(nonFormsgMetadata)

        // Assert
        expect(result.isErr()).toBeTrue()
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          StripeMetadataNotFormsgError,
        )
        // Ensure we do NOT misclassify this as a malformed FormSG event.
        expect(result._unsafeUnwrapErr()).not.toBeInstanceOf(
          StripeMetadataInvalidError,
        )
      })

      it('should return StripeMetadataNotFormsgError when metadata has only a subset of FormSG fields', () => {
        // Arrange: another tenant happens to set `env` but not the other
        // FormSG-specific fields - still not a FormSG event.
        const partialMetadata: Stripe.Metadata = {
          env: MOCK_ENV,
          source: 'external-integration',
        }

        // Act
        const result = getMetadataPaymentId(partialMetadata)

        // Assert
        expect(result.isErr()).toBeTrue()
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          StripeMetadataNotFormsgError,
        )
      })

      it('should return StripeMetadataNotFormsgError for an empty metadata object', () => {
        // Act
        const result = getMetadataPaymentId({})

        // Assert
        expect(result.isErr()).toBeTrue()
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          StripeMetadataNotFormsgError,
        )
      })
    })

    describe('FormSG Stripe events with malformed payment fields', () => {
      it('should return StripeMetadataInvalidError when paymentId is missing', () => {
        // Arrange: this *is* a FormSG event (env/formTitle/formId/submissionId
        // are all present), but paymentId is absent - this is a distinct
        // failure mode from a non-FormSG event.
        const metadata = buildFormsgMetadata()
        delete metadata.paymentId

        // Act
        const result = getMetadataPaymentId(metadata)

        // Assert
        expect(result.isErr()).toBeTrue()
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          StripeMetadataInvalidError,
        )
        // Ensure we do NOT misclassify a FormSG event as non-FormSG.
        expect(result._unsafeUnwrapErr()).not.toBeInstanceOf(
          StripeMetadataNotFormsgError,
        )
      })

      it('should return StripeMetadataInvalidError when paymentContactEmail is missing', () => {
        // Arrange
        const metadata = buildFormsgMetadata()
        delete metadata.paymentContactEmail

        // Act
        const result = getMetadataPaymentId(metadata)

        // Assert
        expect(result.isErr()).toBeTrue()
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          StripeMetadataInvalidError,
        )
      })

      it('should return StripeMetadataValidPaymentIdNotFoundError when paymentId is not a valid ObjectId', () => {
        // Arrange
        const metadata = buildFormsgMetadata({ paymentId: 'not-an-object-id' })

        // Act
        const result = getMetadataPaymentId(metadata)

        // Assert
        expect(result.isErr()).toBeTrue()
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          StripeMetadataValidPaymentIdNotFoundError,
        )
      })

      it('should return StripeMetadataIncorrectEnvError when env does not match the current site', () => {
        // Arrange
        const metadata = buildFormsgMetadata({ env: 'some-other-env' })

        // Act
        const result = getMetadataPaymentId(metadata)

        // Assert
        expect(result.isErr()).toBeTrue()
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(
          StripeMetadataIncorrectEnvError,
        )
      })
    })

    describe('happy path', () => {
      it('should return ok(paymentId) when metadata is a valid FormSG payment metadata', () => {
        // Arrange
        const metadata = buildFormsgMetadata()

        // Act
        const result = getMetadataPaymentId(metadata)

        // Assert
        expect(result.isOk()).toBeTrue()
        expect(result._unsafeUnwrap()).toEqual(MOCK_PAYMENT_ID)
      })
    })
  })

  describe('mapRouteError', () => {
    it('should map StripeMetadataNotFormsgError to 400 BAD_REQUEST', () => {
      // Act
      const { statusCode } = mapRouteError(new StripeMetadataNotFormsgError())

      // Assert
      expect(statusCode).toEqual(StatusCodes.BAD_REQUEST)
    })

    it('should map StripeMetadataInvalidError to 400 BAD_REQUEST', () => {
      // Act
      const { statusCode } = mapRouteError(new StripeMetadataInvalidError())

      // Assert
      expect(statusCode).toEqual(StatusCodes.BAD_REQUEST)
    })

    it('should map other malformed event errors to 400 BAD_REQUEST', () => {
      // Sanity: peer errors in the same case arm still behave the same after
      // adding StripeMetadataNotFormsgError to it.
      expect(
        mapRouteError(new MalformedStripeEventObjectError()).statusCode,
      ).toEqual(StatusCodes.BAD_REQUEST)
      expect(
        mapRouteError(new MalformedStripeChargeObjectError()).statusCode,
      ).toEqual(StatusCodes.BAD_REQUEST)
    })
  })
})
