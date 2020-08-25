import { ObjectId } from 'bson'
import { readFileSync } from 'fs'

import { attachmentsAreValid } from 'src/app/utils/attachment'

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

// const zipWithFolder = {
//   filename: 'folder.zip',
//   content: readFileSync('./tests/unit/backend/resources/folder.zip'),
//   fieldId: String(new ObjectId()),
// }

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

// const zipRepeated = {
//   filename: 'repeated.zip',
//   content: readFileSync('./tests/unit/backend/resources/repeated.zip'),
//   fieldId: String(new ObjectId()),
// }

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
