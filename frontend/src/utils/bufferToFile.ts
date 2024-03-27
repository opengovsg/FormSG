/**
 * Converts a buffer to a file
 * @param data
 * @param filename
 * @returns
 */
const bufferToFile = (data: Iterable<number>, filename: string): File => {
  const bufferArray = Uint8Array.from(data)
  const blob = new Blob([bufferArray])
  const file = new File([blob], filename)

  return file
}

export default bufferToFile
