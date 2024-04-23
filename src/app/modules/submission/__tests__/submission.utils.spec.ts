import { ObjectId } from 'bson'
import { readFileSync } from 'fs'
import { cloneDeep, merge } from 'lodash'

import { BasicField, FormResponseMode } from '../../../../../shared/types'
import { SingleAnswerFieldResponse } from '../../../../types'
import {
  areAttachmentsMoreThanLimit,
  getInvalidFileExtensions,
  getResponseModeFilter,
  mapAttachmentsFromResponses,
} from '../submission.utils'

const validSingleFile = {
  filename: 'govtech.jpg',
  content: readFileSync('./__tests__/unit/backend/resources/govtech.jpg'),
  fieldId: String(new ObjectId()),
}

const invalidSingleFile = {
  filename: 'invalid.py',
  content: readFileSync('./__tests__/unit/backend/resources/invalid.py'),
  fieldId: String(new ObjectId()),
}

const zipWithValidAndInvalid = {
  filename: 'invalidandvalid.zip',
  content: readFileSync(
    './__tests__/unit/backend/resources/invalidandvalid.zip',
  ),
  fieldId: String(new ObjectId()),
}

const zipNestedInvalid = {
  filename: 'nested.zip',
  content: readFileSync('./__tests__/unit/backend/resources/nestedInvalid.zip'),
  fieldId: String(new ObjectId()),
}

const zipNestedValid = {
  filename: 'nestedValid.zip',
  content: readFileSync('./__tests__/unit/backend/resources/nestedValid.zip'),
  fieldId: String(new ObjectId()),
}

const zipOnlyInvalid = {
  filename: 'onlyinvalid.zip',
  content: readFileSync('./__tests__/unit/backend/resources/onlyinvalid.zip'),
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
  }) as unknown as SingleAnswerFieldResponse

describe('submission.utils', () => {
  describe('getResponseModeFilter', () => {
    const ALL_FIELD_TYPES = Object.values(BasicField).map((fieldType) => ({
      fieldType,
    }))

    it('should return emailMode filter when encrypted=false is passed', async () => {
      // Act
      const modeFilter = getResponseModeFilter(false)
      const actual = modeFilter(ALL_FIELD_TYPES)

      // Assert
      expect(modeFilter.name).toEqual('clearResponseModeFilter')
      // Should filter out image and statement fields in email mode.
      const typesToBeFiltered = [BasicField.Image, BasicField.Statement]
      typesToBeFiltered.forEach((fieldType) => {
        expect(actual).not.toContainEqual(
          expect.objectContaining({
            fieldType,
          }),
        )
      })
      expect(actual.length).toEqual(
        ALL_FIELD_TYPES.length - typesToBeFiltered.length,
      )
    })

    it('should return encryptMode filter when encrypted=true is passed', async () => {
      // Act
      const modeFilter = getResponseModeFilter(true)
      const actual = modeFilter(ALL_FIELD_TYPES)

      // Assert
      expect(modeFilter.name).toEqual('encryptedResponseModeFilter')
      // Should only return verifiable fields.
      expect(actual).toEqual(
        expect.arrayContaining([
          { fieldType: BasicField.Mobile },
          { fieldType: BasicField.Email },
        ]),
      )
      expect(actual.length).toEqual(2)
    })
  })

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

  describe('areAttachmentsMoreThanLimit', () => {
    describe('email mode', () => {
      it('should pass attachments when they are smaller than 7MB', () => {
        expect(
          areAttachmentsMoreThanLimit(
            [validSingleFile, zipOnlyValid],
            FormResponseMode.Email,
          ),
        ).toBe(false)
      })

      it('should fail when a single attachment is larger than 7MB', () => {
        const modifiedBigFile = cloneDeep(validSingleFile)
        modifiedBigFile.content = Buffer.alloc(7000001)
        expect(
          areAttachmentsMoreThanLimit(
            [modifiedBigFile],
            FormResponseMode.Email,
          ),
        ).toBe(true)
      })

      it('should fail when attachments add up to more than 7MB', () => {
        const modifiedBigFile1 = cloneDeep(validSingleFile)
        const modifiedBigFile2 = cloneDeep(validSingleFile)
        modifiedBigFile1.content = Buffer.alloc(3500000)
        modifiedBigFile2.content = Buffer.alloc(3500001)
        expect(
          areAttachmentsMoreThanLimit(
            [modifiedBigFile1, modifiedBigFile2],
            FormResponseMode.Email,
          ),
        ).toBe(true)
      })
    })
    describe('storage mode', () => {
      it('should pass attachments when they are smaller than 20MB', () => {
        expect(
          areAttachmentsMoreThanLimit(
            [validSingleFile, zipOnlyValid],
            FormResponseMode.Encrypt,
          ),
        ).toBe(false)
      })

      it('should fail when a single attachment is larger than 20MB', () => {
        const modifiedBigFile = cloneDeep(validSingleFile)
        modifiedBigFile.content = Buffer.alloc(20000001)
        expect(
          areAttachmentsMoreThanLimit(
            [modifiedBigFile],
            FormResponseMode.Encrypt,
          ),
        ).toBe(true)
      })

      it('should fail when attachments add up to more than 20MB', () => {
        const modifiedBigFile1 = cloneDeep(validSingleFile)
        const modifiedBigFile2 = cloneDeep(validSingleFile)
        modifiedBigFile1.content = Buffer.alloc(10000000)
        modifiedBigFile2.content = Buffer.alloc(10000001)
        expect(
          areAttachmentsMoreThanLimit(
            [modifiedBigFile1, modifiedBigFile2],
            FormResponseMode.Encrypt,
          ),
        ).toBe(true)
      })
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
