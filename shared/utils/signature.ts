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
    'Signature_Captured_',
    fieldId,
    timestamp ? `_${timestamp}` : '',
  ].join('')

  const fileExtension = isSvg ? 'svg' : 'png'
  return `${fileName}.${fileExtension}`
}

export const convertToSignatureSvgDataURI = (
  vectorArray: SignatureVectorArray,
  targetWidth = 500,
  targetHeight = 300,
  padding = 10,
): string => {
  if (vectorArray.length === 0) return ''

  const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray) // shrink the whitespace around signature
  const boxWidth = maxX - minX || 1
  const boxHeight = maxY - minY || 1

  const scaleX = (targetWidth - 2 * padding) / boxWidth
  const scaleY = (targetHeight - 2 * padding) / boxHeight
  const scale = Math.min(scaleX, scaleY)

  const scaledWidth = boxWidth * scale + 2 * padding
  const scaledHeight = boxHeight * scale + 2 * padding

  const paths = vectorArray.map((stroke) => {
    if (stroke.length === 0) return ''
    const d = stroke
      .map(([x, y]) => {
        const normX = (x - minX) * scale + padding
        const normY = (y - minY) * scale + padding
        return `${normX.toFixed(2)} ${normY.toFixed(2)}`
      })
      .join(' L ')
    return `<path
      d="M ${d}"
      stroke="black"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
    />`
  })

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${scaledWidth}" height="${scaledHeight}"
         viewBox="0 0 ${scaledWidth} ${scaledHeight}">
      <rect width="100%" height="100%" fill="white" />
      ${paths.join('\n')}
    </svg>
  `.trim()

  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}
