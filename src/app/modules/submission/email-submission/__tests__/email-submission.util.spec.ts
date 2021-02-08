import { ObjectId } from 'bson'
import { readFileSync } from 'fs'
import { cloneDeep, merge } from 'lodash'

import {
  BasicField,
  FieldResponse,
  IAttachmentResponse,
  ISingleAnswerResponse,
} from 'src/types'

import {
  addAttachmentToResponses,
  areAttachmentsMoreThan7MB,
  getInvalidFileExtensions,
  handleDuplicatesInAttachments,
  mapAttachmentsFromResponses,
} from '../email-submission.util'

const validSingleFile = {
  filename: 'govtech.jpg',
  content: readFileSync('./tests/unit/backend/resources/govtech.jpg'),
  fieldId: String(new ObjectId()),
}

const invalidSingleFile = {
  filename: 'invalid.py',
  content: readFileSync('./tests/unit/backend/resources/invalid.py'),
  fieldId: String(new ObjectId()),
}

const zipWithValidAndInvalid = {
  filename: 'invalidandvalid.zip',
  content: readFileSync('./tests/unit/backend/resources/invalidandvalid.zip'),
  fieldId: String(new ObjectId()),
}

const zipNestedInvalid = {
  filename: 'nested.zip',
  content: readFileSync('./tests/unit/backend/resources/nestedInvalid.zip'),
  fieldId: String(new ObjectId()),
}

const zipNestedValid = {
  filename: 'nestedValid.zip',
  content: readFileSync('./tests/unit/backend/resources/nestedValid.zip'),
  fieldId: String(new ObjectId()),
}

const zipOnlyInvalid = {
  filename: 'onlyinvalid.zip',
  content: readFileSync('./tests/unit/backend/resources/onlyinvalid.zip'),
  fieldId: String(new ObjectId()),
}

const zipOnlyValid = {
  filename: 'onlyvalid.zip',
  content: readFileSync('./tests/unit/backend/resources/onlyvalid.zip'),
  fieldId: String(new ObjectId()),
}

const MOCK_ANSWER = 'mockAnswer'

type WithQuestion<T> = T & {
  answer: string
}

const getResponse = (
  _id: string,
  answer: string,
): WithQuestion<ISingleAnswerResponse> =>
  (({
    _id,
    fieldType: BasicField.Attachment,
    question: 'mockQuestion',
    answer,
  } as unknown) as WithQuestion<ISingleAnswerResponse>)

describe('email-submission.util', () => {
  describe('getInvalidFileExtensions', () => {
    it('should return empty array when given a single valid file', async () => {
      const invalid = await getInvalidFileExtensions([validSingleFile])
      expect(invalid).toEqual([])
    })

    it('should return empty array when given a multiple valid files', async () => {
      const invalid = await getInvalidFileExtensions([
        validSingleFile,
        validSingleFile,
      ])
      expect(invalid).toEqual([])
    })

    it('should return invalid extension when given a single invalid file', async () => {
      const invalid = await getInvalidFileExtensions([invalidSingleFile])
      expect(invalid).toEqual(['.py'])
    })

    it('should return invalid extensions when given a multiple invalid files', async () => {
      const invalid = await getInvalidFileExtensions([
        invalidSingleFile,
        invalidSingleFile,
      ])
      expect(invalid).toEqual(['.py', '.py'])
    })

    it('should return invalid extensions when given a mix of valid and invalid files', async () => {
      const invalid = await getInvalidFileExtensions([
        validSingleFile,
        invalidSingleFile,
      ])
      expect(invalid).toEqual(['.py'])
    })

    it('should return empty array when given a single valid zip', async () => {
      const invalid = await getInvalidFileExtensions([zipOnlyValid])
      expect(invalid).toEqual([])
    })

    it('should return empty array when given multiple valid zips', async () => {
      const invalid = await getInvalidFileExtensions([
        zipOnlyValid,
        zipOnlyValid,
      ])
      expect(invalid).toEqual([])
    })

    it('should return invalid extensions when given a zip with only invalid files', async () => {
      const invalid = await getInvalidFileExtensions([zipOnlyInvalid])
      expect(invalid).toEqual(['.a', '.abc', '.py'])
    })

    it('should return invalid extensions when given a zip with a mix of valid and invalid files', async () => {
      const invalid = await getInvalidFileExtensions([zipWithValidAndInvalid])
      expect(invalid).toEqual(['.a', '.oo'])
    })

    it('should return invalid extensions when given multiple invalid zips', async () => {
      const invalid = await getInvalidFileExtensions([
        zipOnlyInvalid,
        zipWithValidAndInvalid,
      ])
      expect(invalid).toEqual(['.a', '.abc', '.py', '.a', '.oo'])
    })

    it('should return invalid extensions when given a mix of valid and invalid zips', async () => {
      const invalid = await getInvalidFileExtensions([
        zipOnlyValid,
        zipOnlyInvalid,
      ])
      expect(invalid).toEqual(['.a', '.abc', '.py'])
    })

    it('should return empty array when given nested zips with valid filetypes', async () => {
      const invalid = await getInvalidFileExtensions([zipNestedValid])
      expect(invalid).toEqual([])
    })

    it('should return invalid extensions when given nested zips with invalid filetypes', async () => {
      const invalid = await getInvalidFileExtensions([zipNestedInvalid])
      expect(invalid).toEqual(['.a', '.oo'])
    })
  })

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
      expect(((firstResponse as unknown) as IAttachmentResponse).filename).toBe(
        firstAttachment.filename,
      )
      expect(
        ((firstResponse as unknown) as IAttachmentResponse).content,
      ).toEqual(firstAttachment.content)
      expect(secondResponse.answer).toBe(secondAttachment.filename)
      expect(
        ((secondResponse as unknown) as IAttachmentResponse).filename,
      ).toBe(secondAttachment.filename)
      expect(
        ((secondResponse as unknown) as IAttachmentResponse).content,
      ).toEqual(secondAttachment.content)
    })

    it('should overwrite answer with filename when they are different', () => {
      const attachment = validSingleFile
      const response = getResponse(attachment.fieldId, MOCK_ANSWER)
      addAttachmentToResponses([response], [attachment])
      expect(response.answer).toBe(attachment.filename)
      expect(((response as unknown) as IAttachmentResponse).filename).toBe(
        attachment.filename,
      )
      expect(((response as unknown) as IAttachmentResponse).content).toEqual(
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

  describe('areAttachmentsMoreThan7MB', () => {
    it('should pass attachments when they are smaller than 7MB', () => {
      expect(areAttachmentsMoreThan7MB([validSingleFile, zipOnlyValid])).toBe(
        false,
      )
    })

    it('should fail when a single attachment is larger than 7MB', () => {
      const modifiedBigFile = cloneDeep(validSingleFile)
      modifiedBigFile.content = Buffer.alloc(7000001)
      expect(areAttachmentsMoreThan7MB([modifiedBigFile])).toBe(true)
    })

    it('should fail when attachments add up to more than 7MB', () => {
      const modifiedBigFile1 = cloneDeep(validSingleFile)
      const modifiedBigFile2 = cloneDeep(validSingleFile)
      modifiedBigFile1.content = Buffer.alloc(3500000)
      modifiedBigFile2.content = Buffer.alloc(3500001)
      expect(
        areAttachmentsMoreThan7MB([modifiedBigFile1, modifiedBigFile2]),
      ).toBe(true)
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

  describe('mapAttachmentsFromParsedResponses', () => {
    it('should filter fields out when they are not attachments', () => {
      const response = getResponse(String(new ObjectId()), MOCK_ANSWER)
      response.fieldType = BasicField.YesNo
      expect(mapAttachmentsFromResponses([response])).toEqual([])
    })

    it('should correctly extract filename and content when inputs are valid', () => {
      const firstAttachment = validSingleFile
      const secondAttachment = zipOnlyValid
      const firstResponse = merge(
        getResponse(firstAttachment.fieldId, MOCK_ANSWER),
        firstAttachment,
      )
      const secondResponse = merge(
        getResponse(secondAttachment.fieldId, MOCK_ANSWER),
        secondAttachment,
      )
      const result = mapAttachmentsFromResponses([
        firstResponse,
        secondResponse,
      ])
      expect(result.length).toBe(2)
      expect(result[0]).toEqual({
        fieldId: firstAttachment.fieldId,
        filename: firstAttachment.filename,
        content: firstAttachment.content,
      })
      expect(result[1]).toEqual({
        fieldId: secondAttachment.fieldId,
        filename: secondAttachment.filename,
        content: secondAttachment.content,
      })
    })
  })
})
