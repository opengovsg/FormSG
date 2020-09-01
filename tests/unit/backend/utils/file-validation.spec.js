const {
  getFileExtension,
  isInvalidFileExtension,
  getInvalidFileExtensionsInZip,
} = require('../../../../dist/backend/shared/util/file-validation')

describe('getFileExtension', () => {
  const tests = [
    {
      name: 'handles file name with extension',
      input: 'image.jpg',
      expected: '.jpg',
    },
    {
      name: 'handles file name with no extension',
      input: 'image',
      expected: '',
    },
    {
      name: 'handles file name with multiple dots',
      input: 'file.a.txt',
      expected: '.txt',
    },
    {
      name: 'handles file name with multiple consecutive dots',
      input: 'file...a.zip',
      expected: '.zip',
    },
  ]
  tests.forEach((t) => {
    it(t.name, () => {
      const actual = getFileExtension(t.input)
      expect(actual).toEqual(t.expected)
    })
  })
})

describe('isInvalidFileExtension', () => {
  const tests = [
    {
      name: 'should return false when given valid extension',
      input: '.jpg',
      expected: false,
    },
    {
      name: 'should return true when given invalid extension',
      input: '.invalid',
      expected: true,
    },
    {
      name: 'should return false when given valid extension that is mixed case',
      input: '.jPG',
      expected: false,
    },
    {
      name:
        'should return true when given invalid extension that is mixed case',
      input: '.InvalId',
      expected: true,
    },
  ]
  tests.forEach((t) => {
    it(t.name, () => {
      const actual = isInvalidFileExtension(t.input)
      expect(actual).toEqual(t.expected)
    })
  })
})

describe('getInvalidFileExtensionsInZip on server', () => {
  const fs = require('fs')
  const tests = [
    {
      name: 'should return [] when there is only valid files',
      file: './tests/unit/backend/resources/onlyvalid.zip',
      expected: [],
    },
    {
      name: 'should return invalid extensions when there is only invalid ext',
      file: './tests/unit/backend/resources/onlyinvalid.zip',
      expected: ['.a', '.abc', '.py'],
    },
    {
      name: 'should return only invalid extensions',
      file: './tests/unit/backend/resources/invalidandvalid.zip',
      expected: ['.a', '.oo'],
    },
    {
      name: 'should exclude repeated invalid extensions',
      file: './tests/unit/backend/resources/repeated.zip',
      expected: ['.a'],
    },
    {
      name: 'should exclude folders',
      file: './tests/unit/backend/resources/folder.zip',
      expected: [],
    },
    {
      name: 'should include invalid extensions in nested zip files',
      file: './tests/unit/backend/resources/nestedInvalid.zip',
      expected: ['.a', '.oo'],
    },
  ]
  tests.forEach((t) => {
    it(t.name, async () => {
      const fn = getInvalidFileExtensionsInZip('server')
      const file = fs.readFileSync(t.file, 'binary')
      const actual = await fn(file)
      expect(actual).toEqual(t.expected)
    })
  })
})
