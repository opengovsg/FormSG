import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import { PaymentsUpdateDto, PaymentType } from 'shared/types'

import { getEncryptedFormModel } from 'src/app/models/form.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import { InvalidPaymentAmountError } from 'src/app/modules/payments/payments.errors'
import { IEncryptedFormDocument } from 'src/types'

import { FormNotFoundError } from '../../form.errors'
import * as AdminFormPaymentService from '../admin-form.payment.service'

const EncryptFormModel = getEncryptedFormModel(mongoose)
describe('admin-form.payment.service', () => {
  describe('updatePayments', () => {
    // Arrange
    const mockFormId = new ObjectId().toString()

    describe('Fixed Payment Type', () => {
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

        const updatedPaymentSettingsExceeded = {
          ...updatedPaymentSettings,
          amount_cents: 100000001,
        } as PaymentsUpdateDto

        // Act
        const actualResult = await AdminFormPaymentService.updatePayments(
          mockFormId,
          updatedPaymentSettingsExceeded,
        )

        // Assert
        expect(actualResult.isErr()).toEqual(true)
        expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
          InvalidPaymentAmountError,
        )
      })

      it('should return InvalidPaymentAmountError if payment amount is below minPaymentAmountCents', async () => {
        // Arrange

        const updatedPaymentSettingsBelow = {
          ...updatedPaymentSettings,
          amount_cents: 49,
        } as PaymentsUpdateDto

        // Act
        const actualResult = await AdminFormPaymentService.updatePayments(
          mockFormId,
          updatedPaymentSettingsBelow,
        )

        // Assert
        expect(actualResult.isErr()).toEqual(true)
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

        expect(actualResult.isOk()).toEqual(true)
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
        expect(actualResult.isErr()).toEqual(true)
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
        expect(actualResult.isErr()).toEqual(true)
        expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(
          FormNotFoundError,
        )
      })
    })
  })
})
