import { ObjectId } from 'bson'
import { readFileSync } from 'fs'
import { cloneDeep, merge } from 'lodash'

import {
  addAttachmentToResponses,
  areAttachmentsMoreThan7MB,
  attachmentsAreValid,
  handleDuplicatesInAttachments,
  mapAttachmentsFromParsedResponses,
} from 'src/app/utils/attachment'
import {
  BasicField,
  IAttachmentResponse,
  ISingleAnswerResponse,
} from 'src/types'

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

describe('attachmentsAreValid', () => {
  it('should return true when given a single valid file', async () => {
    const isValid = await attachmentsAreValid([validSingleFile])
    expect(isValid).toBe(true)
  })

  it('should return true when given a multiple valid files', async () => {
    const isValid = await attachmentsAreValid([
      validSingleFile,
      validSingleFile,
    ])
    expect(isValid).toBe(true)
  })

  it('should return false when given a single invalid file', async () => {
    const isValid = await attachmentsAreValid([invalidSingleFile])
    expect(isValid).toBe(false)
  })

  it('should return false when given a multiple invalid files', async () => {
    const isValid = await attachmentsAreValid([
      invalidSingleFile,
      invalidSingleFile,
    ])
    expect(isValid).toBe(false)
  })

  it('should return false when given a mix of valid and invalid files', async () => {
    const isValid = await attachmentsAreValid([
      validSingleFile,
      invalidSingleFile,
    ])
    expect(isValid).toBe(false)
  })

  it('should return true when given a single valid zip', async () => {
    const isValid = await attachmentsAreValid([zipOnlyValid])
    expect(isValid).toBe(true)
  })

  it('should return true when given multiple valid zips', async () => {
    const isValid = await attachmentsAreValid([zipOnlyValid, zipOnlyValid])
    expect(isValid).toBe(true)
  })

  it('should return false when given a zip with only invalid files', async () => {
    const isValid = await attachmentsAreValid([zipOnlyInvalid])
    expect(isValid).toBe(false)
  })

  it('should return false when given a zip with a mix of valid and invalid files', async () => {
    const isValid = await attachmentsAreValid([zipWithValidAndInvalid])
    expect(isValid).toBe(false)
  })

  it('should return false when given multiple invalid zips', async () => {
    const isValid = await attachmentsAreValid([
      zipOnlyInvalid,
      zipWithValidAndInvalid,
    ])
    expect(isValid).toBe(false)
  })

  it('should return false when given a mix of valid and invalid zips', async () => {
    const isValid = await attachmentsAreValid([zipOnlyValid, zipOnlyInvalid])
    expect(isValid).toBe(false)
  })

  it('should return true when given nested zips with valid filetypes', async () => {
    const isValid = await attachmentsAreValid([zipNestedValid])
    expect(isValid).toBe(true)
  })

  it('should return false when given nested zips with invalid filetypes', async () => {
    const isValid = await attachmentsAreValid([zipNestedInvalid])
    expect(isValid).toBe(false)
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
    expect((firstResponse as IAttachmentResponse).filename).toBe(
      firstAttachment.filename,
    )
    expect((firstResponse as IAttachmentResponse).content).toEqual(
      firstAttachment.content,
    )
    expect(secondResponse.answer).toBe(secondAttachment.filename)
    expect((secondResponse as IAttachmentResponse).filename).toBe(
      secondAttachment.filename,
    )
    expect((secondResponse as IAttachmentResponse).content).toEqual(
      secondAttachment.content,
    )
  })

  it('should overwrite answer with filename when they are different', () => {
    const attachment = validSingleFile
    const response = getResponse(attachment.fieldId, MOCK_ANSWER)
    addAttachmentToResponses([response], [attachment])
    expect(response.answer).toBe(attachment.filename)
    expect((response as IAttachmentResponse).filename).toBe(attachment.filename)
    expect((response as IAttachmentResponse).content).toEqual(
      attachment.content,
    )
  })

  it('should do nothing when responses are empty', () => {
    const responses = []
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
    expect(mapAttachmentsFromParsedResponses([response])).toEqual([])
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
    const result = mapAttachmentsFromParsedResponses([
      firstResponse,
      secondResponse,
    ])
    expect(result.length).toBe(2)
    expect(result[0]).toEqual({
      filename: firstAttachment.filename,
      content: firstAttachment.content,
    })
    expect(result[1]).toEqual({
      filename: secondAttachment.filename,
      content: secondAttachment.content,
    })
  })
})

const getResponse = (_id: string, answer: string): ISingleAnswerResponse => ({
  _id,
  fieldType: BasicField.Attachment,
  question: 'mockQuestion',
  answer,
})
