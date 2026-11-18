import expressHandler from '__tests__/unit/backend/helpers/jest-express'

import { validatePaymentSubmission } from '../encrypt-submission.middleware'

jest.mock('src/app/modules/datadog/datadog.utils')

describe('encrypt-submission.middleware', () => {
  describe('validatePaymentSubmission', () => {
    it('should return message key when payment settings have been updated', async () => {
      const mockReq = expressHandler.mockRequest({
        body: {
          paymentProducts: [{ data: { id: 'mock-product-id', quantity: 1 } }],
        },
      })
      mockReq.formsg = {
        formDef: {
          _id: 'mockFormId',
          toObject: () => ({
            _id: 'mockFormId',
            payments_field: {},
          }),
        },
      } as never

      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      await validatePaymentSubmission(mockReq as never, mockRes, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'The payment settings in this form have been updated. Please refresh and try again.',
        messageKey:
          'features.publicForm.backendErrors.submission.payment.settingsUpdated',
      })
    })
  })
})
