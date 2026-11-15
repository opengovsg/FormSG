import JSZip from 'jszip'
import flattenDeep from 'lodash/flattenDeep'
import uniq from 'lodash/uniq'

// Note: Guide should be updated if the list of valid extensions is changed.
// https://guide.form.gov.sg/faq/faq/attachments
export const VALID_EXTENSIONS = [
  '.264',
  '.asc',
  '.avi',
  '.bmp',
  '.cer',
  '.class',
  '.csv',
  '.dat',
  '.dcm',
  '.dgn',
  '.doc',
  '.docx',
  '.dot',
  '.dwf',
  '.dwg',
  '.dxf',
  '.edr',
  '.ent',
  '.eps',
  '.gif',
  '.gno',
  '.gz',
  '.heif',
  '.hevc',
  '.htm',
  '.html',
  '.jdr',
  '.jfif',
  '.jpeg',
  '.jpg',
  '.json',
  '.log',
  '.m4a',
  '.mov',
  '.mp3',
  '.mp4',
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
  '.opencert',
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
  '.ts',
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

export const VALID_WHITELIST_FILE_EXTENSIONS = ['.csv']

/**
 * Extracts the file extension of a given filename.
 *
 * @param filename name of the file to check the extension for
 * @return the file extension if it exists, otherwise an empty string.
 */
export const getFileExtension = (filename: string): string => {
  const splits = filename.split('.')
  if (splits.length < 2) {
    return ''
  }
  return `.${splits[splits.length - 1]}`
}

/**
 * Checks whether the given file extension is valid against the list of valid
 * extensions.
 *
 * @param ext the file extension to check
 * @return `true` if the file extension is invalid, otherwise `false`.
 */
export const isInvalidFileExtension = (ext: string): boolean =>
  !VALID_EXTENSIONS.includes(ext.toLowerCase())

export const normaliseFileType = (fileType: string): string => {
  const lowerCased = fileType.trim().toLowerCase()
  return lowerCased.startsWith('.') ? lowerCased : `.${lowerCased}`
}

export const allowsEveryFileType = (allowedFileTypes: string[] = []) =>
  allowedFileTypes.length === 0

export const validateAllowedFileTypes = (fileTypes: string[]): boolean =>
  new Set(fileTypes).size === fileTypes.length &&
  fileTypes.every((fileType) => VALID_EXTENSIONS.includes(fileType))

// Unzip tools and file systems end a name at NUL, so `run.exe\0.pdf` is saved as `run.exe`
export const hasControlCharacters = (name: string): boolean =>
  /\p{Cc}/u.test(name)

export const isAllowedFileType = (
  filename: string,
  allowedFileTypes: string[] = [],
): boolean =>
  allowsEveryFileType(allowedFileTypes) ||
  (!hasControlCharacters(filename) &&
    allowedFileTypes.includes(getFileExtension(filename).toLowerCase()))

/**
 * Dives into a zip file and recursively checks if it contains
 * any invalid files. A file is deemed invalid if its file extension
 * is not valid as checked by isInvalidFileExtension.
 *
 * @param dataFormat the format of the file to use in JSZip. Should be `'blob'` for `Blob` file type, and `nodebuffer` for `Buffer` file type.
 * @param file the file to check
 * @return array of invalid file extensions in given zip file
 */
export const MAX_ZIP_NESTING_DEPTH = 3
export const MAX_ZIP_ENTRY_COUNT = 1000

export const getInvalidFileExtensionsInZip = (
  dataFormat: 'blob' | 'nodebuffer',
  file: Blob | Buffer,
): Promise<string[]> => {
  // We wrap this checker into a closure because the data format
  // needs to be different for frontend vs backend.
  let entryCount = 0
  const checkZipForInvalidFiles = async (
    file: Blob | Buffer,
    depth: number,
  ): Promise<string[]> => {
    if (depth > MAX_ZIP_NESTING_DEPTH) {
      throw new Error('Zip file nesting is too deep')
    }
    const zip = await JSZip.loadAsync(file)
    const fileEntries = zip.filter((_relativePath, fileEntry) => !fileEntry.dir)
    entryCount += fileEntries.length
    if (entryCount > MAX_ZIP_ENTRY_COUNT) {
      throw new Error('Zip file has too many entries')
    }
    const invalidFileExtensions: (string | string[] | Promise<string[]>)[] = []
    fileEntries.forEach((fileEntry) => {
      const fileExt = getFileExtension(fileEntry.name)
      if (isInvalidFileExtension(fileExt)) {
        return invalidFileExtensions.push(fileExt)
      }
      if (fileExt === '.zip') {
        return invalidFileExtensions.push(
          fileEntry
            .async(dataFormat)
            .then((nested) => checkZipForInvalidFiles(nested, depth + 1)),
        )
      }
    })

    const results = await Promise.all(invalidFileExtensions)
    return uniq(flattenDeep(results))
  }
  return checkZipForInvalidFiles(file, 0)
}

export const inspectZip = async (
  file: Buffer,
): Promise<{
  entryNames: string[]
  isUncompressed: boolean
  hasExtraBytes: boolean
  hasMismatchedNames: boolean
  decompressAndFindInvalidExtensions: () => Promise<string[]>
}> => {
  const zip = await JSZip.loadAsync(file)
  const decompressAndFindInvalidExtensions = async () => {
    const invalidExtensions = await Promise.all(
      zip
        .filter((_relativePath, entry) => !entry.dir)
        .map(async (entry) => {
          const fileExt = getFileExtension(entry.name)
          if (isInvalidFileExtension(fileExt)) return [fileExt]
          if (fileExt !== '.zip') return []
          return getInvalidFileExtensionsInZip(
            'nodebuffer',
            await entry.async('nodebuffer'),
          )
        }),
    )
    return uniq(flattenDeep(invalidExtensions))
  }
  const entryNames = Object.keys(zip.files)
  const { centralNames, ...centralDirectory } = readCentralDirectory(file)
  const entryNameSet = new Set(entryNames)
  return {
    entryNames,
    ...centralDirectory,
    hasMismatchedNames:
      centralNames.length !== entryNames.length ||
      centralNames.some((name) => !entryNameSet.has(name)),
    decompressAndFindInvalidExtensions,
  }
}

/**
 * Lists the names other unzip tools read from a zip's central directory.
 * JSZip names entries from their local headers instead, and keys them by name
 * so shows one of several entries sharing a name. JSZip reads central
 * directory records from the offset in the end of central directory record
 * for as long as they follow one another, whatever count that record declares.
 */
const readCentralDirectory = (
  file: Buffer,
): {
  centralNames: string[]
  isUncompressed: boolean
  hasExtraBytes: boolean
} => {
  const CENTRAL_DIRECTORY_RECORD = 0x02014b50
  const STORED = 0
  const endOfCentralDirectory = file.lastIndexOf('PK\x05\x06', -1, 'latin1')
  let offset = file.readUInt32LE(endOfCentralDirectory + 16)
  // JSZip shifts its offsets past bytes added to a zip, so these records would
  // no longer be the ones it reads
  const hasExtraBytes =
    offset + file.readUInt32LE(endOfCentralDirectory + 12) !==
    endOfCentralDirectory
  const centralNames: string[] = []
  let isUncompressed = true
  while (
    offset + 46 <= file.length &&
    file.readUInt32LE(offset) === CENTRAL_DIRECTORY_RECORD
  ) {
    isUncompressed &&= file.readUInt16LE(offset + 10) === STORED
    const nameLength = file.readUInt16LE(offset + 28)
    centralNames.push(
      file.toString('utf8', offset + 46, offset + 46 + nameLength),
    )
    offset +=
      46 +
      file.readUInt16LE(offset + 28) +
      file.readUInt16LE(offset + 30) +
      file.readUInt16LE(offset + 32)
  }
  return { centralNames, isUncompressed, hasExtraBytes }
}
