export const signatureStrokeSize = 8
export const signatureStrokeThinning = 0.5
export const signatureStrokeSmoothing = 0.5
export const signatureStrokeStreamline = 0.5

export const signatureOutputPaddingDefault = 10
export const signatureOutputStrokeFillStyle = 'black'

export const boxHeightDefault = 1
export const boxWidthDefault = 1

/**
 *  converts a vectorArray to a string output
 * @param input - signature vector array
 * @returns JSON stringified vector array
 */
export const convertToSignatureStringOutput = (
  input: [number, number, number][][],
): string => {
  return JSON.stringify(input)
}

/**
 * converts a vectorArray to a string output
 * @param input - JSON stringified vector array
 * @returns signature vector array
 */
export const convertToSignatureVectorArray = (
  input: string,
): [number, number, number][][] => {
  return JSON.parse(input)
}

type BoundingBox = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/**
 * returns a boundingBox containing the inputted signatureArray, removing whitespace around the input
 * @param vectorArray - signature vector array
 * @returns BoundingBox with min/max for X and Y coordinates
 */
export const getBoundingBox = (
  vectorArray: [number, number, number][][],
): BoundingBox => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const stroke of vectorArray) {
    for (const [x, y] of stroke) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  return { minX, minY, maxX, maxY }
}

export const getSignatureFileName = ({
  fieldId,
  timestamp,
  isSvg = false,
}: {
  fieldId: string
  timestamp?: string // incase we want to add timestamp in the future
  isSvg?: boolean
}): string => {
  const fileName = [
    'Signature_Captured',
    fieldId,
    timestamp ? `_${timestamp}` : '',
  ].join('')

  const fileExtension = isSvg ? 'svg' : 'png'
  return `${fileName}.${fileExtension}`
}
