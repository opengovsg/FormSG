export const convertToSignatureStringOutput = (
  input: [number, number, number][][],
): string => {
  return JSON.stringify(input)
}

export const convertToSignatureVectoryArray = (
  input: string,
): [number, number, number][][] => {
  return JSON.parse(input)
}
