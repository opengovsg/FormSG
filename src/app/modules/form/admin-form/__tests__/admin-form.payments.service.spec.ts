import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import {
  PaymentsProductUpdateDto,
  PaymentsUpdateDto,
  PaymentType,
} from 'shared/types'

import * as PaymentConfig from 'src/app/config/features/payment.config'
import { getEncryptedFormModel } from 'src/app/models/form.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import { InvalidPaymentAmountError } from 'src/app/modules/payments/payments.errors'
import { IEncryptedFormDocument } from 'src/types'

import { FormNotFoundError } from '../../form.errors'
import * as AdminFormPaymentService from '../admin-form.payments.service'

const EncryptFormModel = getEncryptedFormModel(mongoose)
describe('admin-form.payment.service', () => {
  describe('updatePayments', () => {
    const mockFormId = new ObjectId().toString()
    describe('When Payment Type is Fixed', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })
      afterEach(() => {
        jest.restoreAllMocks()
      })
      const updatedPaymentSettings: PaymentsUpdateDto = {
        enabled: true,
        amount_cents: 5000,
        description: 'some description',
        payment_type: PaymentType.Fixed,
      }

      const mockUpdatedForm = {
        _id: mockFormId,
        payments_field: updatedPaymentSettings,
      }

      it('should return InvalidPaymentAmountError if payment amount exceeds maxPaymentAmountCents', async () => {
        // Arrange
        jest.replaceProperty(PaymentConfig, 'paymentConfig', {
          ...PaymentConfig.paymentConfig,
          maxPaymentAmountCents: 4000,
        })
        const updatedPaymentSettingsExceeded = {
          ...updatedPaymentSettings,
          amount_cents: 4001,
        } as PaymentsUpdateDto

        // Act
        const actualResult = await AdminFormPaymentService.updatePayments(
          mockFormId,
          updatedPaymentSettingsExceeded,
        )

        // Assert
        expect(actualResult.isErr()).toBeTrue()
        expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
          InvalidPaymentAmountError,
        )
      })

      it('should return InvalidPaymentAmountError if payment amount is below minPaymentAmountCents', async () => {
        // Arrange
        jest.replaceProperty(PaymentConfig, 'paymentConfig', {
          ...PaymentConfig.paymentConfig,
          minPaymentAmountCents: 4000,
        })
        const updatedPaymentSettingsBelow = {
          ...updatedPaymentSettings,
          amount_cents: 3999,
        } as PaymentsUpdateDto

        // Act
        const actualResult = await AdminFormPaymentService.updatePayments(
          mockFormId,
          updatedPaymentSettingsBelow,
        )

        // Assert
        expect(actualResult.isErr()).toBeTrue()
        expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
          InvalidPaymentAmountError,
        )
      })

      it('should successfuly call updatePaymentsById with formId and newPayments and return the updated payment settings', async () => {
        // Arrange
        const putSpy = jest
          .spyOn(EncryptFormModel, 'updatePaymentsById')
          .mockResolvedValueOnce(
            mockUpdatedForm as unknown as IEncryptedFormDocument,
          )

        // Act
        const actualResult = await AdminFormPaymentService.updatePayments(
          mockFormId,
          updatedPaymentSettings,
        )

        // Assert
        expect(putSpy).toHaveBeenCalledWith(mockFormId, updatedPaymentSettings)

        expect(actualResult.isOk()).toBeTrue()
        // Should equal updatedPaymentSettings obj
        expect(actualResult._unsafeUnwrap()).toEqual(updatedPaymentSettings)
      })

      it('should return PossibleDatabaseError if db update fails', async () => {
        // Arrange
        const putSpy = jest
          .spyOn(EncryptFormModel, 'updatePaymentsById')
          .mockRejectedValueOnce(new DatabaseError())

        // Act
        const actualResult = await AdminFormPaymentService.updatePayments(
          mockFormId,
          updatedPaymentSettings,
        )

        // Assert
        expect(putSpy).toHaveBeenCalledWith(mockFormId, updatedPaymentSettings)
        expect(actualResult.isErr()).toBeTrue()
        expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
      })

      it('should return FormNotFoundError if no form is returned after updating db', async () => {
        // Arrange
        const putSpy = jest
          .spyOn(EncryptFormModel, 'updatePaymentsById')
          .mockResolvedValueOnce(null)

        // Act
        const actualResult = await AdminFormPaymentService.updatePayments(
          mockFormId,
          updatedPaymentSettings,
        )

        // Assert
        expect(putSpy).toHaveBeenCalledWith(mockFormId, updatedPaymentSettings)
        expect(actualResult.isErr()).toBeTrue()
        expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
          FormNotFoundError,
        )
      })
    })

    describe('When Payment Type is Variable', () => {
      const defaultVariablePaymentSettings: PaymentsUpdateDto = {
        enabled: true,
        min_amount: 1000,
        max_amount: 1000,
        description: 'some description',
        payment_type: PaymentType.Variable,
      }
      beforeEach(() => {
        jest.clearAllMocks()
      })

      it('should return OK if min_amount is greater than max_amount', async () => {
        const updatedPaymentSettingsMaxAboveMin = {
          ...defaultVariablePaymentSettings,
          min_amount: 500,
          max_amount: 1500,
        }

        const mockUpdatedForm = {
          _id: mockFormId,
          payments_field: updatedPaymentSettingsMaxAboveMin,
        }
        const putSpy = jest
          .spyOn(EncryptFormModel, 'updatePaymentsById')
          .mockResolvedValueOnce(
            mockUpdatedForm as unknown as IEncryptedFormDocument,
          )
        // Act
        const actualResult = await AdminFormPaymentService.updatePayments(
          mockFormId,
          updatedPaymentSettingsMaxAboveMin,
        )

        // Assert
        expect(putSpy).toHaveBeenCalledWith(
          mockFormId,
          updatedPaymentSettingsMaxAboveMin,
        )
        expect(actualResult.isOk()).toBeTrue()
        expect(actualResult._unsafeUnwrap()).toEqual(
          updatedPaymentSettingsMaxAboveMin,
        )
      })

      it('should return OK if min_amount is greater than configMax', async () => {
        const updatedPaymentSettingsMaxAboveMin = {
          ...defaultVariablePaymentSettings,
          min_amount: 500,
          max_amount: 1500,
        }

        const mockUpdatedForm = {
          _id: mockFormId,
          payments_field: updatedPaymentSettingsMaxAboveMin,
        }
        const putSpy = jest
          .spyOn(EncryptFormModel, 'updatePaymentsById')
          .mockResolvedValueOnce(
            mockUpdatedForm as unknown as IEncryptedFormDocument,
          )
        // Act
        const actualResult = await AdminFormPaymentService.updatePayments(
          mockFormId,
          updatedPaymentSettingsMaxAboveMin,
        )

        // Assert
        expect(putSpy).toHaveBeenCalledWith(
          mockFormId,
          updatedPaymentSettingsMaxAboveMin,
        )
        expect(actualResult.isOk()).toBeTrue()
        expect(actualResult._unsafeUnwrap()).toEqual(
          updatedPaymentSettingsMaxAboveMin,
        )
      })

      it('should return error if max_amount was lesser than min_amount', async () => {
        const updatedPaymentSettingsMaxBelowMin = {
          ...defaultVariablePaymentSettings,
          min_amount: 1000,
          max_amount: 500,
        } as PaymentsUpdateDto

        const putSpy = jest.spyOn(EncryptFormModel, 'updatePaymentsById')
        // Act
        const actualResult = await AdminFormPaymentService.updatePayments(
          mockFormId,
          updatedPaymentSettingsMaxBelowMin,
        )

        // Assert
        expect(putSpy).not.toHaveBeenCalled()
        expect(actualResult.isErr()).toBeTrue()
        expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
          InvalidPaymentAmountError,
        )
      })

      it('should return error if min_amount was lesser than minPaymentAmountCents', async () => {
        jest.replaceProperty(PaymentConfig, 'paymentConfig', {
          ...PaymentConfig.paymentConfig,
          minPaymentAmountCents: 100,
        })
        const updatedPaymentSettingsBelow = {
          ...defaultVariablePaymentSettings,
          min_amount: 50,
          max_amount: 1000,
        } as PaymentsUpdateDto

        const putSpy = jest.spyOn(EncryptFormModel, 'updatePaymentsById')
        // Act
        const actualResult = await AdminFormPaymentService.updatePayments(
          mockFormId,
          updatedPaymentSettingsBelow,
        )

        expect(putSpy).not.toHaveBeenCalled()
        expect(actualResult.isErr()).toBeTrue()
        expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
          InvalidPaymentAmountError,
        )
      })
    })
  })

  describe('updatePaymentsProduct', () => {
    const mockFormId = new ObjectId().toString()

    describe('with multi qty enabled', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      it('should allow updates when product * max qty is below max amount', async () => {
        jest.replaceProperty(PaymentConfig, 'paymentConfig', {
          ...PaymentConfig.paymentConfig,
          maxPaymentAmountCents: 100,
        })
        const updatedProducts = [
          {
            multi_qty: true,
            max_qty: 9,
            amount_cents: 10,
          },
        ] as PaymentsProductUpdateDto

        const putSpy = jest
          .spyOn(EncryptFormModel, 'updatePaymentsProductById')
          .mockResolvedValueOnce({
            payments_field: {},
          } as unknown as IEncryptedFormDocument)

        // Act
        const actualResult =
          await AdminFormPaymentService.updatePaymentsProduct(
            mockFormId,
            updatedProducts,
          )

        expect(putSpy).toHaveBeenCalledOnce()
        expect(actualResult.isOk()).toBeTrue()
      })

      it('should allow updates when product * max qty is at max amount', async () => {
        jest.replaceProperty(PaymentConfig, 'paymentConfig', {
          ...PaymentConfig.paymentConfig,
          maxPaymentAmountCents: 100,
        })
        const updatedProducts = [
          {
            multi_qty: true,
            max_qty: 10,
            amount_cents: 10,
          },
        ] as PaymentsProductUpdateDto

        const putSpy = jest
          .spyOn(EncryptFormModel, 'updatePaymentsProductById')
          .mockResolvedValueOnce({
            payments_field: {},
          } as unknown as IEncryptedFormDocument)

        // Act
        const actualResult =
          await AdminFormPaymentService.updatePaymentsProduct(
            mockFormId,
            updatedProducts,
          )

        expect(putSpy).toHaveBeenCalled()
        expect(actualResult.isOk()).toBeTrue()
      })

      it('should disallow updates when product * max qty exceeds max amount', async () => {
        jest.replaceProperty(PaymentConfig, 'paymentConfig', {
          ...PaymentConfig.paymentConfig,
          maxPaymentAmountCents: 100,
        })
        const updatedProducts = [
          {
            multi_qty: true,
            max_qty: 11,
            amount_cents: 10,
          },
        ] as PaymentsProductUpdateDto

        const putSpy = jest
          .spyOn(EncryptFormModel, 'updatePaymentsProductById')
          .mockResolvedValueOnce({
            payments_field: {},
          } as unknown as IEncryptedFormDocument)

        // Act
        const actualResult =
          await AdminFormPaymentService.updatePaymentsProduct(
            mockFormId,
            updatedProducts,
          )

        expect(putSpy).not.toHaveBeenCalled()
        expect(actualResult.isErr()).toBeTrue()
        expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
          InvalidPaymentAmountError,
        )
      })
    })

    describe('with multi qty disabled', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })
      it('should allow updates when product * max qty possibly exceeds max amount', async () => {
        jest.replaceProperty(PaymentConfig, 'paymentConfig', {
          ...PaymentConfig.paymentConfig,
          maxPaymentAmountCents: 100,
        })
        const updatedProducts = [
          {
            multi_qty: true,
            max_qty: 11,
            amount_cents: 10,
          },
        ] as PaymentsProductUpdateDto

        const putSpy = jest
          .spyOn(EncryptFormModel, 'updatePaymentsProductById')
          .mockResolvedValueOnce({
            payments_field: {},
          } as unknown as IEncryptedFormDocument)

        // Act
        const actualResult =
          await AdminFormPaymentService.updatePaymentsProduct(
            mockFormId,
            updatedProducts,
          )

        expect(putSpy).not.toHaveBeenCalled()
        expect(actualResult.isOk()).toBeTrue()
      })
    })
  })
})
