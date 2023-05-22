import fs from 'fs'

import {
  getFileExtension,
  getInvalidFileExtensionsInZip,
  isInvalidFileExtension,
} from '../file-validation'

describe('File validation utils', () => {
  describe('getFileExtension', () => {
    it('should handle file name with extension', () => {
      const actual = getFileExtension('image.jpg')
      expect(actual).toEqual('.jpg')
    })

    it('should handle file name with no extension', async () => {
      const actual = getFileExtension('image-no-extension')
      expect(actual).toEqual('')
    })

    it('should handle file name with multiple periods', async () => {
      const actual = getFileExtension('file.a.txt')
      expect(actual).toEqual('.txt')
    })

    it('should handle file name with consecutive periodsa', async () => {
      const actual = getFileExtension('file....a.zip')
      expect(actual).toEqual('.zip')
    })
  })

  describe('isInvalidFileExtension', () => {
    it('should return false when given valid extension', () => {
      const actual = isInvalidFileExtension('.jpg')
      expect(actual).toEqual(false)
    })

    it('should return true when given invalid extension', () => {
      const actual = isInvalidFileExtension('.invalid')
      expect(actual).toEqual(true)
    })

    it('should return false when given valid extension that is mixed case', () => {
      const actual = isInvalidFileExtension('.jPG')
      expect(actual).toEqual(false)
    })

    it('should return true when given invalid extension that is mixed case', () => {
      const actual = isInvalidFileExtension('.sPoNgEbOb')
      expect(actual).toEqual(true)
    })
  })

  // Note that blob version is unable to be tested as Jest is running in a node environment.
  describe('getInvalidFileExtensionsInZip with nodebuffer', () => {
    it('should return empty array when there is only valid files', async () => {
      const file = fs.readFileSync(
        './__tests__/unit/backend/resources/onlyvalid.zip',
      )
      const actual = await getInvalidFileExtensionsInZip('nodebuffer', file)
      expect(actual).toEqual([])
    })

    it('should return invalid extensions when zipped files are all invalid file extensions', async () => {
      const file = fs.readFileSync(
        './__tests__/unit/backend/resources/onlyinvalid.zip',
      )
      const actual = await getInvalidFileExtensionsInZip('nodebuffer', file)
      expect(actual).toEqual(['.a', '.abc', '.py'])
    })

    it('should return only invalid extensions when zip has some valid file extensions', async () => {
      const file = fs.readFileSync(
        './__tests__/unit/backend/resources/invalidandvalid.zip',
      )
      const actual = await getInvalidFileExtensionsInZip('nodebuffer', file)
      expect(actual).toEqual(['.a', '.oo'])
    })

    it('should exclude repeated invalid extensions', async () => {
      const file = fs.readFileSync(
        './__tests__/unit/backend/resources/repeated.zip',
      )
      const actual = await getInvalidFileExtensionsInZip('nodebuffer', file)
      expect(actual).toEqual(['.a'])
    })

    it('should exclude folders', async () => {
      const file = fs.readFileSync(
        './__tests__/unit/backend/resources/folder.zip',
      )
      const actual = await getInvalidFileExtensionsInZip('nodebuffer', file)
      expect(actual).toEqual([])
    })

    it('should include invalid extensions in nested zip files', async () => {
      const file = fs.readFileSync(
        './__tests__/unit/backend/resources/nestedInvalid.zip',
      )
      const actual = await getInvalidFileExtensionsInZip('nodebuffer', file)
      expect(actual).toEqual(['.a', '.oo'])
    })
  })
})
