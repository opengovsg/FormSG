import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { StatusCodes } from 'http-status-codes'
import { errAsync, okAsync } from 'neverthrow'
import Stripe from 'stripe'

import { stripe } from 'src/app/loaders/stripe'

import {
  MalformedStripeEventObjectError,
  StripeMetadataIncorrectEnvError,
  StripeMetadataInvalidError,
  StripeMetadataNotFormsgError,
} from '../stripe.errors'
import { _handleStripeEventUpdatesForTest } from '../stripe.events.controller'
import * as StripeService from '../stripe.service'

jest.mock('../stripe.service')
const MockStripeService = jest.mocked(StripeService)

// constructEvent verifies the Stripe webhook signature against the raw body
// using the configured secret. None of that is the unit under test here, so
// we stub it out and return a minimally-shaped event - handleStripeEvent is
// mocked, so it never inspects the event contents.
jest.spyOn(stripe.webhooks, 'constructEvent').mockReturnValue({
  id: 'evt_TEST',
  type: 'payment_intent.succeeded',
} as unknown as Stripe.Event)

const buildMockReq = () =>
  expressHandler.mockRequest({
    body: undefined,
    others: {
      headers: { 'stripe-signature': 'mock-sig' },
      rawBody: '{}',
    },
  })

describe('stripe.events.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('_handleStripeEventUpdates', () => {
    it('should return 400 BAD_REQUEST when the stripe-signature header is missing', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        others: { headers: {} },
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await _handleStripeEventUpdatesForTest(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.sendStatus).toHaveBeenCalledExactlyOnceWith(
        StatusCodes.BAD_REQUEST,
      )
      expect(MockStripeService.handleStripeEvent).not.toHaveBeenCalled()
    })

    it('should return 200 OK when the event is successfully processed', async () => {
      // Arrange
      MockStripeService.handleStripeEvent.mockReturnValueOnce(
        okAsync(undefined),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await _handleStripeEventUpdatesForTest(buildMockReq(), mockRes, jest.fn())

      // Assert
      expect(mockRes.sendStatus).toHaveBeenCalledExactlyOnceWith(StatusCodes.OK)
    })

    it('should return 202 ACCEPTED when the event is from a non-FormSG source (StripeMetadataNotFormsgError)', async () => {
      // Arrange: simulate the service rejecting the event because its
      // metadata does not look like FormSG metadata at all (e.g. some other
      // integration on the same Stripe account).
      MockStripeService.handleStripeEvent.mockReturnValueOnce(
        errAsync(new StripeMetadataNotFormsgError()),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await _handleStripeEventUpdatesForTest(buildMockReq(), mockRes, jest.fn())

      // Assert: the controller intercepts non-FormSG events with 202 so
      // Stripe stops retrying.
      expect(mockRes.sendStatus).toHaveBeenCalledExactlyOnceWith(
        StatusCodes.ACCEPTED,
      )
      expect(mockRes.status).not.toHaveBeenCalled()
      expect(mockRes.json).not.toHaveBeenCalled()
    })

    it('should return 202 ACCEPTED when a FormSG event has malformed metadata (StripeMetadataInvalidError, e.g. missing paymentId)', async () => {
      // Arrange: this is a *different* failure mode from the previous test -
      // the event IS from FormSG but its payment metadata is malformed
      // (e.g. paymentId is missing). The controller should still return 202
      // so that Stripe doesn't keep retrying an unrecoverable event.
      MockStripeService.handleStripeEvent.mockReturnValueOnce(
        errAsync(new StripeMetadataInvalidError()),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await _handleStripeEventUpdatesForTest(buildMockReq(), mockRes, jest.fn())

      // Assert
      expect(mockRes.sendStatus).toHaveBeenCalledExactlyOnceWith(
        StatusCodes.ACCEPTED,
      )
    })

    it('should return 202 ACCEPTED when the event targets a different environment (StripeMetadataIncorrectEnvError)', async () => {
      // Arrange
      MockStripeService.handleStripeEvent.mockReturnValueOnce(
        errAsync(new StripeMetadataIncorrectEnvError()),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await _handleStripeEventUpdatesForTest(buildMockReq(), mockRes, jest.fn())

      // Assert
      expect(mockRes.sendStatus).toHaveBeenCalledExactlyOnceWith(
        StatusCodes.ACCEPTED,
      )
    })

    it('should fall through to mapRouteError (400 BAD_REQUEST) when the service returns a non-intercepted error', async () => {
      // Arrange: MalformedStripeEventObjectError is NOT in the 202 intercept
      // list, so it should be mapped via mapRouteError to its real status.
      // This guards against accidentally widening the 202 intercept to all
      // errors when adding new error types.
      MockStripeService.handleStripeEvent.mockReturnValueOnce(
        errAsync(new MalformedStripeEventObjectError()),
      )
      const mockRes = expressHandler.mockResponse()

      // Act
      await _handleStripeEventUpdatesForTest(buildMockReq(), mockRes, jest.fn())

      // Assert
      expect(mockRes.sendStatus).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledExactlyOnceWith(
        StatusCodes.BAD_REQUEST,
      )
      expect(mockRes.json).toHaveBeenCalledOnce()
    })
  })
})
