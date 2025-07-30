export const signatureStrokeSize = 8
export const signatureStrokeThinning = 0.5
export const signatureStrokeSmoothing = 0.5
export const signatureStrokeStreamline = 0.5

export const signatureOutputBoxWidthDefault = 500
export const signatureOutputBoxHeightDefault = 500
export const signatureOutputPaddingDefault = 10
export const signatureOutputStrokeFillStyle = 'black'

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

type BoundingBox = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

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
  svg = false,
}: {
  fieldId: string
  timestamp?: string // incase we want to add timestamp in the future
  svg?: boolean
}): string => {
  return `Signature_Captured_${fieldId}${timestamp ? `_${timestamp}` : ''}.${svg ? 'svg' : 'png'}`
}
