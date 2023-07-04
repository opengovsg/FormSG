import { ObjectId } from 'bson-ext'
import moment from 'moment-timezone'
import { FormPaymentsField, PaymentType } from 'shared/types'

import { SubmissionData } from 'src/types'

import {
  createEncryptedSubmissionDto,
  getPaymentAmount,
} from '../encrypt-submission.utils'

describe('encrypt-submission.utils', () => {
  describe('createEncryptedSubmissionDto', () => {
    it('should create an encrypted submission DTO sucessfully', () => {
      // Arrange
      const createdDate = new Date()
      const submissionData = {
        _id: new ObjectId(),
        created: createdDate,
        encryptedContent: 'some encrypted content',
        verifiedContent: 'some verified content',
      } as SubmissionData
      const attachmentPresignedUrls = {
        someSubmissionId: 'some presigned url',
      }

      // Act
      const actual = createEncryptedSubmissionDto(
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
})
