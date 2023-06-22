import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { StatusCodes } from 'http-status-codes'
import { PaymentChannel } from 'shared/types'

import * as AdminFormPaymentsController from '../admin-form.payments.controller'

describe('admin-form.payments.controller', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    await dbHandler.clearDatabase()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('handleUpdatePayments', () => {
    it('when no payment_type is supplied', async () => {
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
        body: {
          enabled: true,
          payment_type: null,
        },
      })
      const mockRes = expressHandler.mockResponse()
      await AdminFormPaymentsController._handleUpdatePayments(
        MOCK_REQ,
        mockRes,
        jest.fn(),
      )

      expect(mockRes.status).toHaveBeenCalledWith(
        StatusCodes.UNPROCESSABLE_ENTITY,
      )
      expect(mockRes.json).toHaveBeenCalledWith({})
    })
  })
})
