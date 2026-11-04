import JSZip from 'jszip'

import fs from 'fs'
import path from 'path'

import {
  getFileExtension,
  getInvalidFileExtensionsInZip,
  isInvalidFileExtension,
  MAX_ZIP_ENTRY_COUNT,
  MAX_ZIP_NESTING_DEPTH,
} from '../file-validation'

const RESOURCES = path.join(__dirname, '../../../../__tests__/resources')

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
      const file = fs.readFileSync(path.join(RESOURCES, 'onlyvalid.zip'))
      const actual = await getInvalidFileExtensionsInZip('nodebuffer', file)
      expect(actual).toEqual([])
    })

    it('should return invalid extensions when zipped files are all invalid file extensions', async () => {
      const file = fs.readFileSync(path.join(RESOURCES, 'onlyinvalid.zip'))
      const actual = await getInvalidFileExtensionsInZip('nodebuffer', file)
      expect(actual).toEqual(['.a', '.abc', '.py'])
    })

    it('should return only invalid extensions when zip has some valid file extensions', async () => {
      const file = fs.readFileSync(path.join(RESOURCES, 'invalidandvalid.zip'))
      const actual = await getInvalidFileExtensionsInZip('nodebuffer', file)
      expect(actual).toEqual(['.a', '.oo'])
    })

    it('should exclude repeated invalid extensions', async () => {
      const file = fs.readFileSync(path.join(RESOURCES, 'repeated.zip'))
      const actual = await getInvalidFileExtensionsInZip('nodebuffer', file)
      expect(actual).toEqual(['.a'])
    })

    it('should exclude folders', async () => {
      const file = fs.readFileSync(path.join(RESOURCES, 'folder.zip'))
      const actual = await getInvalidFileExtensionsInZip('nodebuffer', file)
      expect(actual).toEqual([])
    })

    it('should include invalid extensions in nested zip files', async () => {
      const file = fs.readFileSync(path.join(RESOURCES, 'nestedInvalid.zip'))
      const actual = await getInvalidFileExtensionsInZip('nodebuffer', file)
      expect(actual).toEqual(['.a', '.oo'])
    })

    const nestZip = async (depth: number): Promise<Buffer> => {
      let inner = await new JSZip()
        .file('leaf.txt', 'leaf')
        .generateAsync({ type: 'nodebuffer' })
      for (let i = 0; i < depth; i++) {
        inner = await new JSZip()
          .file(`level-${i}.zip`, inner)
          .generateAsync({ type: 'nodebuffer' })
      }
      return inner
    }

    it('should resolve a zip nested within the allowed depth', async () => {
      const file = await nestZip(MAX_ZIP_NESTING_DEPTH - 1)
      await expect(
        getInvalidFileExtensionsInZip('nodebuffer', file),
      ).resolves.toEqual([])
    })

    it('should reject a zip nested beyond the allowed depth', async () => {
      const file = await nestZip(MAX_ZIP_NESTING_DEPTH + 1)
      await expect(
        getInvalidFileExtensionsInZip('nodebuffer', file),
      ).rejects.toThrow()
    })

    it('should reject a zip with more entries than allowed', async () => {
      const zip = new JSZip()
      for (let i = 0; i < MAX_ZIP_ENTRY_COUNT + 1; i++) {
        zip.file(`file-${i}.txt`, 'x')
      }
      const file = await zip.generateAsync({ type: 'nodebuffer' })
      await expect(
        getInvalidFileExtensionsInZip('nodebuffer', file),
      ).rejects.toThrow()
    })

    it('should not leave an unhandled rejection when a nested zip precedes the entry limit', async () => {
      const unhandled = jest.fn()
      process.on('unhandledRejection', unhandled)
      const zip = new JSZip()
      zip.file('nested.zip', await nestZip(MAX_ZIP_NESTING_DEPTH + 1))
      for (let i = 0; i < MAX_ZIP_ENTRY_COUNT; i++) {
        zip.file(`file-${i}.txt`, 'x')
      }
      const file = await zip.generateAsync({ type: 'nodebuffer' })

      await expect(
        getInvalidFileExtensionsInZip('nodebuffer', file),
      ).rejects.toThrow()
      await new Promise((resolve) => setTimeout(resolve, 100))

      process.off('unhandledRejection', unhandled)
      expect(unhandled).not.toHaveBeenCalled()
    })
  })
})
