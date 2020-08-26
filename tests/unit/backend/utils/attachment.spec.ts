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
  test('returns true for a single valid file', async () => {
    return expect(attachmentsAreValid([validSingleFile])).resolves.toBe(true)
  })

  test('returns true for multiple valid files', async () => {
    return expect(
      attachmentsAreValid([validSingleFile, validSingleFile]),
    ).resolves.toBe(true)
  })

  test('returns false for a single invalid file', async () => {
    return expect(attachmentsAreValid([invalidSingleFile])).resolves.toBe(false)
  })

  test('returns false for multiple invalid files', async () => {
    return expect(
      attachmentsAreValid([invalidSingleFile, invalidSingleFile]),
    ).resolves.toBe(false)
  })

  test('returns false for a mix of valid and invalid files', async () => {
    return expect(
      attachmentsAreValid([validSingleFile, invalidSingleFile]),
    ).resolves.toBe(false)
  })

  test('returns true for a single valid zip', async () => {
    return expect(attachmentsAreValid([zipOnlyValid])).resolves.toBe(true)
  })

  test('returns true for multiple valid zips', async () => {
    return expect(
      attachmentsAreValid([zipOnlyValid, zipOnlyValid]),
    ).resolves.toBe(true)
  })

  test('returns false for a zip with only invalid files', async () => {
    return expect(attachmentsAreValid([zipOnlyInvalid])).resolves.toBe(false)
  })

  test('returns false for a zip with a mix of valid and invalid files', async () => {
    return expect(attachmentsAreValid([zipWithValidAndInvalid])).resolves.toBe(
      false,
    )
  })

  test('returns false for multiple invalid zips', async () => {
    return expect(
      attachmentsAreValid([zipOnlyInvalid, zipWithValidAndInvalid]),
    ).resolves.toBe(false)
  })

  test('returns false for a mix of valid and invalid zips', async () => {
    return expect(
      attachmentsAreValid([zipOnlyValid, zipOnlyInvalid]),
    ).resolves.toBe(false)
  })

  test('returns true for nested zips with valid filetypes', async () => {
    return expect(attachmentsAreValid([zipNestedValid])).resolves.toBe(true)
  })

  test('returns true for nested zips with invalid filetypes', async () => {
    return expect(attachmentsAreValid([zipNestedInvalid])).resolves.toBe(false)
  })
})

describe('addAttachmentToResponses', () => {
  test('adds attachments to responses correctly', async () => {
    const attachments = [validSingleFile, zipOnlyValid]
    const responses = [
      getResponse(attachments[0].fieldId, attachments[0].filename),
      getResponse(attachments[1].fieldId, attachments[1].filename),
    ]
    addAttachmentToResponses(responses, attachments)
    expect(responses[0].answer).toBe(attachments[0].filename)
    expect((responses[0] as IAttachmentResponse).filename).toBe(
      attachments[0].filename,
    )
    expect((responses[0] as IAttachmentResponse).content).toEqual(
      attachments[0].content,
    )
    expect(responses[1].answer).toBe(attachments[1].filename)
    expect((responses[1] as IAttachmentResponse).filename).toBe(
      attachments[1].filename,
    )
    expect((responses[1] as IAttachmentResponse).content).toEqual(
      attachments[1].content,
    )
  })

  test('overwrites answer with filename', async () => {
    const attachments = [validSingleFile]
    const responses = [getResponse(attachments[0].fieldId, MOCK_ANSWER)]
    addAttachmentToResponses(responses, attachments)
    expect(responses[0].answer).toBe(attachments[0].filename)
    expect((responses[0] as IAttachmentResponse).filename).toBe(
      attachments[0].filename,
    )
    expect((responses[0] as IAttachmentResponse).content).toEqual(
      attachments[0].content,
    )
  })

  test('does nothing for empty responses', async () => {
    const responses = []
    addAttachmentToResponses(responses, [validSingleFile])
    expect(responses).toEqual([])
  })

  test('does nothing when there are no attachments', async () => {
    const responses = [getResponse(validSingleFile.fieldId, MOCK_ANSWER)]
    addAttachmentToResponses(responses, [])
    expect(responses).toEqual([
      getResponse(validSingleFile.fieldId, MOCK_ANSWER),
    ])
  })
})

describe('areAttachmentsMoreThan7MB', () => {
  test('passes attachments smaller than 7MB', async () => {
    expect(areAttachmentsMoreThan7MB([validSingleFile, zipOnlyValid])).toBe(
      false,
    )
  })

  test('fails a single attachment larger than 7MB', async () => {
    const modifiedBigFile = cloneDeep(validSingleFile)
    modifiedBigFile.content = Buffer.alloc(7000001)
    expect(areAttachmentsMoreThan7MB([modifiedBigFile])).toBe(true)
  })

  test('fails attachments which add up to more than 7MB', async () => {
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
  test('makes filenames unique by appending count', async () => {
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
  test('filters out non-attachment fields', async () => {
    const response = getResponse(String(new ObjectId()), MOCK_ANSWER)
    response.fieldType = BasicField.YesNo
    expect(mapAttachmentsFromParsedResponses([response])).toEqual([])
  })

  test('correctly extracts filename and content', async () => {
    const attachments = [validSingleFile, zipOnlyValid]
    const responses = [
      merge(getResponse(attachments[0].fieldId, MOCK_ANSWER), attachments[0]),
      merge(getResponse(attachments[1].fieldId, MOCK_ANSWER), attachments[1]),
    ]
    const result = mapAttachmentsFromParsedResponses(responses)
    expect(result.length).toBe(responses.length)
    expect(result[0]).toEqual({
      filename: attachments[0].filename,
      content: attachments[0].content,
    })
    expect(result[1]).toEqual({
      filename: attachments[1].filename,
      content: attachments[1].content,
    })
  })
})

const getResponse = (_id: string, answer: string): ISingleAnswerResponse => ({
  _id,
  fieldType: BasicField.Attachment,
  question: 'mockQuestion',
  answer,
})
