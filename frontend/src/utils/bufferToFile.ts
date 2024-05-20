/**
 * Converts a buffer to a file
 * @param data
 * @param filename
 * @returns
 */
const bufferToFile = (data: ArrayBuffer, filename: string): File => {
  const blob = new Blob([data])
  const file = new File([blob], filename)

  return file
}

export default bufferToFile
