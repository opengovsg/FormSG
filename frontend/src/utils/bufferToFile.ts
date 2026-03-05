/**
 * Converts a buffer to a file
 * @param data
 * @param filename
 * @returns
 */
const bufferToFile = (data: Uint8Array, filename: string): File => {
  const blob = new Blob([data as BlobPart])
  const file = new File([blob], filename)

  return file
}

export default bufferToFile
