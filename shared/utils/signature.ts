export const convertToSignatureStringOutput = (
  input: [number, number, number][][],
): string => {
  return JSON.stringify(input)
}

export const convertToSignatureVectorArray = (
  input: string,
): [number, number, number][][] => {
  return JSON.parse(input)
}
