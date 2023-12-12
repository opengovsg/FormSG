import { ObjectId } from 'bson'
import { readFileSync } from 'fs'
import { cloneDeep } from 'lodash'
import { BasicField } from 'shared/types'

import {
  FieldResponse,
  IAttachmentResponse,
  SingleAnswerFieldResponse,
} from '../../../../../types'
import { ParsedMultipartForm } from '../receiver.types'
import {
  addAttachmentToResponses,
  handleDuplicatesInAttachments,
} from '../receiver.utils'

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

describe('receiver.utils', () => {
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
        {
          responses: [firstResponse, secondResponse],
        } as unknown as ParsedMultipartForm<FieldResponse[]>,
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
      const responses = {
        responses: [getResponse(attachment.fieldId, MOCK_ANSWER)],
      } as unknown as ParsedMultipartForm<FieldResponse[]>
      addAttachmentToResponses(responses, [attachment])
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      expect(responses.responses[0].answer).toBe(attachment.filename)
      expect((responses as unknown as IAttachmentResponse).filename).toBe(
        attachment.filename,
      )
      expect((responses as unknown as IAttachmentResponse).content).toEqual(
        attachment.content,
      )
    })

    it('should do nothing when responses are empty', () => {
      const responses = { responses: [] } as unknown as ParsedMultipartForm<
        FieldResponse[]
      >
      addAttachmentToResponses(responses, [validSingleFile])
      expect(responses).toEqual([])
    })

    it('should do nothing when there are no attachments', () => {
      const responses = {
        responses: [getResponse(validSingleFile.fieldId, MOCK_ANSWER)],
      } as unknown as ParsedMultipartForm<FieldResponse[]>
      addAttachmentToResponses(responses, [])
      expect(responses).toEqual([
        getResponse(validSingleFile.fieldId, MOCK_ANSWER),
      ])
    })
  })

  // Note that if e.g. you have three attachments called abc.txt, abc.txt
  // and 1-abc.txt, they will not be given unique names, i.e. one of the abc.txt
  // will be renamed to 1-abc.txt so you end up with abc.txt, 1-abc.txt and 1-abc.txt.
  describe('handleDuplicatesInAttachments', () => {
    it('should make filenames unique by appending count when there are duplicates', () => {
      const attachments = [
        cloneDeep(validSingleFile),
        cloneDeep(validSingleFile),
        cloneDeep(validSingleFile),
      ]
      handleDuplicatesInAttachments(attachments)
      const newFilenames = attachments.map((att) => att.filename)
      // Expect uniqueness
      expect(newFilenames.length).toBe(new Set(newFilenames).size)
      expect(newFilenames).toContain(validSingleFile.filename)
      expect(newFilenames).toContain(`1-${validSingleFile.filename}`)
      expect(newFilenames).toContain(`2-${validSingleFile.filename}`)
    })
  })
})
