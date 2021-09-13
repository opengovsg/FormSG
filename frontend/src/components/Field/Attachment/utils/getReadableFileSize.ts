/**
 * Converts the given file size in bytes to a human readable string.
 *
 * @example 1100000 -> "1.1 MB"
 * @param fileSizeInBytes the size of the file in bytes to be converted to a readable string
 * @returns the human-readable file size string
 */
export const getReadableFileSize = (fileSizeInBytes: number): string => {
  const i = Math.floor(Math.log(fileSizeInBytes) / Math.log(1000))
  const size = Number((fileSizeInBytes / Math.pow(1000, i)).toFixed(2))
  return size + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i]
}
