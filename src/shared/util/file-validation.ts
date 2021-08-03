import JSZip from 'jszip'
import flattenDeep from 'lodash/flattenDeep'
import uniq from 'lodash/uniq'

import { FilePlatforms } from '../constants'

const validExtensions = [
  '.asc',
  '.avi',
  '.bmp',
  '.cer',
  '.class',
  '.csv',
  '.dat',
  '.dgn',
  '.doc',
  '.docx',
  '.dot',
  '.dwf',
  '.dwg',
  '.dxf',
  '.ent',
  '.eps',
  '.gif',
  '.gz',
  '.htm',
  '.html',
  '.jpeg',
  '.jpg',
  '.log',
  '.mpeg',
  '.mpg',
  '.mpp',
  '.msg',
  '.mso',
  '.oa',
  '.odb',
  '.odf',
  '.odg',
  '.odp',
  '.ods',
  '.odt',
  '.p7m',
  '.p7s',
  '.pcx',
  '.pdf',
  '.png',
  '.pot',
  '.pps',
  '.ppsx',
  '.ppt',
  '.pptx',
  '.psd',
  '.pub',
  '.rtf',
  '.svg',
  '.sxc',
  '.sxd',
  '.sxi',
  '.sxw',
  '.tar',
  '.tif',
  '.tiff',
  '.txt',
  '.vcf',
  '.vsd',
  '.wav',
  '.wmv',
  '.xls',
  '.xlsx',
  '.xml',
  '.zip',
]

/**
 * Extracts the file extension of a given filename.
 *
 * @param filename - Name of the file
 * @return The file extension
 */
export const getFileExtension = (filename: string): string => {
  const splits = filename.split('.')
  if (splits.length < 2) {
    return ''
  }
  return `.${splits[splits.length - 1]}`
}

/**
 * Checks against the list of validExtensions whether the given
 * file extension is valid.
 *
 * @param ext - The file extension
 * @return Whether the file extension is invalid
 */
export const isInvalidFileExtension = (ext: string) =>
  !validExtensions.includes(ext.toLowerCase())

/**
 * Dives into a zip file and recursively checks if it contains
 * any invalid files. A file is deemed invalid if its file extension
 * is not valid as checked by isInvalidFileExtension.
 *
 * To use this checker, first call the function and specify the platform.
 * Then use the resulting checker function to check zip files.
 *
 * @param platform - The platform the code is being
 * run on
 * @return The checker function
 */
export const getInvalidFileExtensionsInZip = (
  platform: FilePlatforms,
): ((file: File | Buffer) => Promise<string[]>) => {
  const dataFormat = platform === FilePlatforms.Browser ? 'blob' : 'nodebuffer'

  // We wrap this checker into a closure because the data format
  // needs to be different for frontend vs backend.
  const checkZipForInvalidFiles = async (
    file: Blob | Buffer,
  ): Promise<string[]> => {
    const zip = await JSZip.loadAsync(file)
    const invalidFileExtensions: (string | string[] | Promise<string[]>)[] = []
    zip.forEach((relativePath, fileEntry) => {
      if (fileEntry.dir) return
      const fileExt = getFileExtension(fileEntry.name)
      if (isInvalidFileExtension(fileExt)) {
        return invalidFileExtensions.push(fileExt)
      }
      if (fileExt === '.zip') {
        return invalidFileExtensions.push(
          fileEntry.async(dataFormat).then(checkZipForInvalidFiles),
        )
      }
    })

    const results = await Promise.all(invalidFileExtensions)
    return uniq(flattenDeep(results))
  }
  return checkZipForInvalidFiles
}
