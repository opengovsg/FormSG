import JSZip from 'jszip'
import flattenDeep from 'lodash/flattenDeep'
import uniq from 'lodash/uniq'

// Note: Guide should be updated if the list of valid extensions is changed.
// https://guide.form.gov.sg/faq/faq/attachments
export const VALID_EXTENSIONS = [
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
  '.jfif',
  '.jpeg',
  '.jpg',
  '.log',
  '.mov',
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

/**
 * Dives into a zip file and recursively checks if it contains
 * any invalid files. A file is deemed invalid if its file extension
 * is not valid as checked by isInvalidFileExtension.
 *
 * @param dataFormat the format of the file to use in JSZip. Should be `'blob'` for `Blob` file type, and `nodebuffer` for `Buffer` file type.
 * @param file the file to check
 * @return array of invalid file extensions in given zip file
 */
export const getInvalidFileExtensionsInZip = (
  dataFormat: 'blob' | 'nodebuffer',
  file: Blob | Buffer,
): Promise<string[]> => {
  // We wrap this checker into a closure because the data format
  // needs to be different for frontend vs backend.
  const checkZipForInvalidFiles = async (
    file: Blob | Buffer,
  ): Promise<string[]> => {
    const zip = await JSZip.loadAsync(file)
    const invalidFileExtensions: (string | string[] | Promise<string[]>)[] = []
    zip.forEach((_relativePath, fileEntry) => {
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
  return checkZipForInvalidFiles(file)
}

/**
 * PROTOTYPE (attachments-v2): presets an admin picks to restrict an attachment
 * field's file types. Each preset is filtered against VALID_EXTENSIONS, so a
 * type only appears once it is on the global list.
 */
export const ATTACHMENT_FILE_TYPE_PRESETS = [
  { id: 'pdf', label: 'PDF', extensions: ['.pdf'] },
  {
    id: 'images',
    label: 'Images',
    extensions: [
      '.bmp',
      '.gif',
      '.jfif',
      '.jpeg',
      '.jpg',
      '.pcx',
      '.png',
      '.psd',
      '.svg',
      '.tif',
      '.tiff',
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    extensions: ['.doc', '.docx', '.dot', '.odt', '.rtf', '.sxw', '.txt'],
  },
  {
    id: 'spreadsheets',
    label: 'Spreadsheets',
    extensions: ['.csv', '.ods', '.sxc', '.xls', '.xlsx'],
  },
  {
    id: 'presentations',
    label: 'Presentations',
    extensions: ['.odp', '.pot', '.pps', '.ppsx', '.ppt', '.pptx', '.sxi'],
  },
  {
    id: 'audioVideo',
    label: 'Audio and video',
    extensions: [
      '.avi',
      '.m4a',
      '.mov',
      '.mp3',
      '.mp4',
      '.mpeg',
      '.mpg',
      '.wav',
      '.wmv',
    ],
  },
  { id: 'archives', label: 'Archives', extensions: ['.gz', '.tar', '.zip'] },
].map((preset) => ({
  ...preset,
  extensions: preset.extensions.filter((ext) => VALID_EXTENSIONS.includes(ext)),
}))

export type AttachmentFileTypeSelection = {
  presets: string[]
  advanced: string[]
}

/** Turns chosen presets plus Advanced picks into one sorted extension list. */
export const expandFileTypes = ({
  presets,
  advanced,
}: AttachmentFileTypeSelection): string[] => {
  const fromPresets = ATTACHMENT_FILE_TYPE_PRESETS.filter((p) =>
    presets.includes(p.id),
  ).flatMap((p) => p.extensions)
  return uniq([...fromPresets, ...advanced]).sort()
}

/**
 * Reverse of expandFileTypes: presets whose every extension is in the saved
 * list show as ticked; anything left over shows under Advanced.
 */
export const splitFileTypes = (
  saved: string[],
): AttachmentFileTypeSelection => {
  const presets = ATTACHMENT_FILE_TYPE_PRESETS.filter(
    (p) =>
      p.extensions.length > 0 &&
      p.extensions.every((ext) => saved.includes(ext)),
  )
  const covered = presets.flatMap((p) => p.extensions)
  return {
    presets: presets.map((p) => p.id),
    advanced: saved.filter((ext) => !covered.includes(ext)).sort(),
  }
}
