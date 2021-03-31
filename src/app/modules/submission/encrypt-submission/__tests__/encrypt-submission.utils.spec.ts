import { ObjectId } from 'bson-ext'
import moment from 'moment-timezone'

import { SubmissionData } from 'src/types'

import { createEncryptedSubmissionDto } from '../encrypt-submission.utils'

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
})
