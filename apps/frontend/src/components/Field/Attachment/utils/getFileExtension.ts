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
