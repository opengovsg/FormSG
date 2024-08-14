import { DECIMAL_BYTE_UNITS } from '~shared/constants/file'

/**
 * Converts the given file size in bytes to a human readable string.
 *
 * @example 1100000 -> "1.1 MB"
 * @param fileSizeInBytes the size of the file in bytes to be converted to a readable string
 * @returns the human-readable file size string
 */
export const getReadableFileSize = (fileSizeInBytes: number): string => {
  if (fileSizeInBytes === 0) {
    return '0 B'
  }
  const i = Math.floor(Math.log(fileSizeInBytes) / Math.log(1000))
  const size = Number((fileSizeInBytes / Math.pow(1000, i)).toFixed(2))
  return size + ' ' + DECIMAL_BYTE_UNITS[i]
}

/**
 * Counterpart to getReadableFileSize
 * Converts the given human readable file size string to the corresponding file size in bytes.
 * @example "1.1 MB" -> 1100000
 * @param readableFileSize the human readable file size string to be converted to bytes
 * @returns the file size in bytes
 */
export const getByteFileSize = (readableFileSize: string): number => {
  const [size, unit] = readableFileSize.split(' ')
  const unitIndex = DECIMAL_BYTE_UNITS.indexOf(unit)
  return Number(size) * Math.pow(1000, unitIndex)
}
