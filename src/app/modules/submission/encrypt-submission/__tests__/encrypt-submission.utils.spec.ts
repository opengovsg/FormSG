import { ObjectId } from 'bson-ext'
import moment from 'moment-timezone'
import { FormPaymentsField, PaymentType, SubmissionType } from 'shared/types'

import { IPopulatedEncryptedForm, StorageModeSubmissionData } from 'src/types'

import {
  createStorageModeSubmissionDto,
  getPaymentAmount,
  getPaymentIntentDescription,
} from '../encrypt-submission.utils'

describe('encrypt-submission.utils', () => {
  describe('createStorageModeSubmissionDto', () => {
    it('should create an encrypted submission DTO sucessfully', () => {
      // Arrange
      const createdDate = new Date()
      const submissionData = {
        _id: new ObjectId(),
        created: createdDate,
        encryptedContent: 'some encrypted content',
        verifiedContent: 'some verified content',
        submissionType: SubmissionType.Encrypt,
      } as StorageModeSubmissionData
      const attachmentPresignedUrls = {
        someSubmissionId: 'some presigned url',
      }

      // Act
      const actual = createStorageModeSubmissionDto(
        submissionData,
        attachmentPresignedUrls,
      )

      // Assert
      expect(actual).toEqual({
        refNo: submissionData._id,
        submissionTime: moment(submissionData.created)
          .tz('Asia/Singapore')
          .format('ddd, D MMM YYYY, hh:mm:ss A'),
        content: submissionData.encryptedContent,
        verified: submissionData.verifiedContent,
        attachmentMetadata: attachmentPresignedUrls,
        submissionType: SubmissionType.Encrypt,
      })
    })
  })
  describe('getPaymentAmount', () => {
    it('should return amount_cents for Fixed Payment Type', () => {
      const expectedAmountCents = 100
      const fixedPaymentData = {
        payment_type: PaymentType.Fixed,
        amount_cents: expectedAmountCents,
      } as FormPaymentsField

      const incomingPaymentData = {
        amount_cents: -1,
      }
      const result = getPaymentAmount(fixedPaymentData, incomingPaymentData)

      expect(result).toEqual(expectedAmountCents)
    })
    it('should return amount_cents for Variable Payment Type', () => {
      const expectedAmountCents = 100
      const fixedPaymentData = {
        payment_type: PaymentType.Variable,
        amount_cents: -1,
      } as FormPaymentsField

      const incomingPaymentData = {
        amount_cents: expectedAmountCents,
      }
      const result = getPaymentAmount(fixedPaymentData, incomingPaymentData)

      expect(result).toEqual(expectedAmountCents)
    })
  })

  describe('getPaymentIntentDescription', () => {
    it('should description for Fixed Payments Type', () => {
      const expectedValue = 'expectedValue'
      const formData = {
        payments_field: {
          payment_type: PaymentType.Fixed,
          description: expectedValue,
          name: 'name',
        },
      } as unknown as IPopulatedEncryptedForm

      const products: any = [{}]

      const result = getPaymentIntentDescription(formData, products)

      expect(result).toEqual(expectedValue)
    })
    it('should return name for Variable Payment Type', () => {
      const expectedValue = 'expectedValue'
      const formData = {
        payments_field: {
          payment_type: PaymentType.Variable,
          description: 'description',
          name: expectedValue,
        },
      } as unknown as IPopulatedEncryptedForm

      const products: any = [{}]

      const result = getPaymentIntentDescription(formData, products)

      expect(result).toEqual(expectedValue)
    })

    it('should return product names for Products Payment Type', () => {
      const expectedItemName1 = 'expectedItemName1'
      const expectedItemName2 = 'expectedItemName2'
      const formData = {
        payments_field: {
          payment_type: PaymentType.Products,
          description: 'description',
          name: 'name',
        },
      } as unknown as IPopulatedEncryptedForm

      const products: any = [
        { data: { name: expectedItemName1 }, quantity: 1 },
        { data: { name: expectedItemName2 }, quantity: 2 },
      ]

      const result = getPaymentIntentDescription(formData, products)

      expect(result).toContain(expectedItemName1)
      expect(result).toContain(expectedItemName2)
    })

    it('should return form title for Products Payment Type when there are no products', () => {
      const expectedValue = 'formTitle'
      const formData = {
        payments_field: {
          payment_type: PaymentType.Products,
          description: 'description',
          name: 'name',
        },
        title: expectedValue,
      } as unknown as IPopulatedEncryptedForm

      const products: any = null

      const result = getPaymentIntentDescription(formData, products)

      expect(result).toContain(expectedValue)
    })
  })
})
