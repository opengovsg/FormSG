import { ObjectId } from 'bson'
import { readFileSync } from 'fs'
import { BasicField } from 'shared/types'

import {
  FieldResponse,
  IAttachmentResponse,
  SingleAnswerFieldResponse,
} from '../../../../../types'
import { addAttachmentToResponses } from '../receiver.utils'

const validSingleFile = {
  filename: 'govtech.jpg',
  content: readFileSync('./__tests__/unit/backend/resources/govtech.jpg'),
  fieldId: String(new ObjectId()),
}

const zipOnlyValid = {
  filename: 'onlyvalid.zip',
  content: readFileSync('./__tests__/unit/backend/resources/onlyvalid.zip'),
  fieldId: String(new ObjectId()),
}

const MOCK_ANSWER = 'mockAnswer'

const getResponse = (_id: string, answer: string): SingleAnswerFieldResponse =>
  ({
    _id,
    fieldType: BasicField.Attachment,
    question: 'mockQuestion',
    answer,
  } as unknown as SingleAnswerFieldResponse)

describe('email-submission.util', () => {
  describe('addAttachmentToResponses', () => {
    it('should add attachments to responses correctly when inputs are valid', () => {
      const firstAttachment = validSingleFile
      const secondAttachment = zipOnlyValid
      const firstResponse = getResponse(
        firstAttachment.fieldId,
        firstAttachment.filename,
      )
      const secondResponse = getResponse(
        secondAttachment.fieldId,
        secondAttachment.filename,
      )
      addAttachmentToResponses(
        [firstResponse, secondResponse],
        [firstAttachment, secondAttachment],
      )
      expect(firstResponse.answer).toBe(firstAttachment.filename)
      expect((firstResponse as unknown as IAttachmentResponse).filename).toBe(
        firstAttachment.filename,
      )
      expect((firstResponse as unknown as IAttachmentResponse).content).toEqual(
        firstAttachment.content,
      )
      expect(secondResponse.answer).toBe(secondAttachment.filename)
      expect((secondResponse as unknown as IAttachmentResponse).filename).toBe(
        secondAttachment.filename,
      )
      expect(
        (secondResponse as unknown as IAttachmentResponse).content,
      ).toEqual(secondAttachment.content)
    })

    it('should overwrite answer with filename when they are different', () => {
      const attachment = validSingleFile
      const response = getResponse(attachment.fieldId, MOCK_ANSWER)
      addAttachmentToResponses([response], [attachment])
      expect(response.answer).toBe(attachment.filename)
      expect((response as unknown as IAttachmentResponse).filename).toBe(
        attachment.filename,
      )
      expect((response as unknown as IAttachmentResponse).content).toEqual(
        attachment.content,
      )
    })

    it('should do nothing when responses are empty', () => {
      const responses: FieldResponse[] = []
      addAttachmentToResponses(responses, [validSingleFile])
      expect(responses).toEqual([])
    })

    it('should do nothing when there are no attachments', () => {
      const responses = [getResponse(validSingleFile.fieldId, MOCK_ANSWER)]
      addAttachmentToResponses(responses, [])
      expect(responses).toEqual([
        getResponse(validSingleFile.fieldId, MOCK_ANSWER),
      ])
    })
  })
})
