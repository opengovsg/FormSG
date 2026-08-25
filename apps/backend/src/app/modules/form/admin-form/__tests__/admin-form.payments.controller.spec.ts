import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import {
  PaymentChannel,
  PaymentsUpdateDto,
  PaymentType,
} from 'formsg-shared/types'
import { StatusCodes } from 'http-status-codes'

import { IMultirespondentForm } from 'src/types'

import * as AdminFormPaymentsController from '../admin-form.payments.controller'

describe('admin-form.payments.controller', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    await dbHandler.clearDatabase()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('handleUpdatePayments', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    describe('legacy payment forms', () => {
      const LEGACY_PAYMENT_FIELDS = {
        enabled: true,
        payment_type: null,
      } as unknown as PaymentsUpdateDto
      it('should fail and return error if no payment_type is supplied', async () => {
        const { form, user } = await dbHandler.insertEncryptForm({
          userBetaFlags: { payment: true },
          formOptions: {
            payments_channel: {
              channel: PaymentChannel.Stripe,
              target_account_id: 'string',
              publishable_key: 'string',
            },
          },
        })

        const MOCK_REQ = expressHandler.mockRequest({
          params: { formId: form._id },
          session: {
            user: {
              _id: user._id,
            },
          },
          body: LEGACY_PAYMENT_FIELDS,
        })
        const mockRes = expressHandler.mockResponse()
        await AdminFormPaymentsController.handleUpdatePaymentsForTest(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        expect(mockRes.status).toHaveBeenCalledWith(
          StatusCodes.UNPROCESSABLE_ENTITY,
        )
        expect(mockRes.json).toHaveBeenCalledOnce()
      })
    })

    describe('multirespondent forms with the mrf-payments flag off', () => {
      // A live payment-enabled MRF: Stripe connected, payments switched on
      // while the flag was still on.
      const MRF_PAYMENT_FORM_OPTIONS: Partial<IMultirespondentForm> = {
        payments_channel: {
          channel: PaymentChannel.Stripe,
          target_account_id: 'string',
          publishable_key: 'string',
        },
        payments_field: {
          enabled: true,
          payment_type: PaymentType.Products,
          products: [],
        },
      }

      // Requests carry no growthbook instance, so the controller resolves the
      // flag to its fail-closed default (off).
      it('should allow disabling payments so admins can kill a live payment', async () => {
        const { form, user } = await dbHandler.insertMultirespondentForm({
          formOptions: MRF_PAYMENT_FORM_OPTIONS,
        })

        const MOCK_REQ = expressHandler.mockRequest({
          params: { formId: form._id },
          session: {
            user: {
              _id: user._id,
            },
          },
          body: {
            enabled: false,
            payment_type: PaymentType.Products,
            products: [],
          } as unknown as PaymentsUpdateDto,
        })
        const mockRes = expressHandler.mockResponse()
        await AdminFormPaymentsController.handleUpdatePaymentsForTest(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({ enabled: false }),
        )
      })

      it('should return 403 when the update would keep payments enabled', async () => {
        const { form, user } = await dbHandler.insertMultirespondentForm({
          formOptions: MRF_PAYMENT_FORM_OPTIONS,
        })

        const MOCK_REQ = expressHandler.mockRequest({
          params: { formId: form._id },
          session: {
            user: {
              _id: user._id,
            },
          },
          body: {
            enabled: true,
            payment_type: PaymentType.Products,
            products: [],
          } as unknown as PaymentsUpdateDto,
        })
        const mockRes = expressHandler.mockResponse()
        await AdminFormPaymentsController.handleUpdatePaymentsForTest(
          MOCK_REQ,
          mockRes,
          jest.fn(),
        )

        expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
        expect(mockRes.json).toHaveBeenCalledOnce()
      })
    })
  })
})
