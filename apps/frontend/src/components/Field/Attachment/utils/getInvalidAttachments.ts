import JSZip from 'jszip'
import { flattenDeep, uniq } from 'lodash'

import {
  MAX_ZIP_ENTRY_COUNT,
  MAX_ZIP_NESTING_DEPTH,
} from 'formsg-shared/utils/file-validation'

import { AttachmentProps } from '../Attachment'

import { getFileExtension } from './getFileExtension'

/**
 * Checks whether the given file extension is valid against the list of valid
 * extensions.
 *
 * @param ext the file extension to check
 * @return `true` if the file extension is invalid, otherwise `false`.
 */
export const isInvalidFileExtension = (
  ext: string,
  accept: AttachmentProps['accept'],
): boolean => {
  // Every extension is valid if accept array is undefined/empty.
  if (!accept) return false
  return !accept.includes(ext.toLowerCase())
}

/**
 * Dives into a zip file and recursively checks if it contains
 * any invalid files. A file is deemed invalid if its file extension
 * is not valid as checked by isInvalidFileExtension.
 *
 * @param file the file to check
 * @return array of invalid file extensions in given zip file
 */
export const getInvalidFileExtensionsInZip = (
  file: File,
  accept: AttachmentProps['accept'],
): Promise<string[]> => {
  // We wrap this checker into a closure for recursive calls.
  let entryCount = 0
  const checkZipForInvalidFiles = async (
    file: Blob,
    depth: number,
  ): Promise<string[]> => {
    if (depth > MAX_ZIP_NESTING_DEPTH) {
      throw new Error('Zip file nesting is too deep')
    }
    const zip = await JSZip.loadAsync(file)
    const invalidFileExtensions: (string | string[] | Promise<string[]>)[] = []
    zip.forEach((_relativePath, fileEntry) => {
      if (fileEntry.dir) return
      entryCount++
      if (entryCount > MAX_ZIP_ENTRY_COUNT) {
        throw new Error('Zip file has too many entries')
      }
      const fileExt = getFileExtension(fileEntry.name)
      if (isInvalidFileExtension(fileExt, accept)) {
        return invalidFileExtensions.push(fileExt)
      }
      if (fileExt === '.zip') {
        return invalidFileExtensions.push(
          fileEntry
            .async('blob')
            .then((nested) => checkZipForInvalidFiles(nested, depth + 1)),
        )
      }
    })

    const results = await Promise.all(invalidFileExtensions)
    return uniq(flattenDeep(results))
  }
  return checkZipForInvalidFiles(file, 0)
}
