import { SignatureVectorArray } from '../types'

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
  input: SignatureVectorArray,
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
): SignatureVectorArray => {
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
  vectorArray: SignatureVectorArray,
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

/**
 * Standardized signature file name used for response outputs that does not render signature image
 */
export const getSignatureFileName = ({
  fieldId,
  responseId,
  isSvg = false,
}: {
  fieldId: string
  responseId: string
  isSvg?: boolean
}): string => {
  const fileName = [
    `signature captured`,
    `responseID(${responseId})`,
    `fieldID(${fieldId})`,
  ].join(' - ')

  const fileExtension = isSvg ? 'svg' : 'png'
  return `${fileName}.${fileExtension}`
}
