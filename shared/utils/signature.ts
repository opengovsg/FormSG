import { SignatureVectorArray } from '../types'

import { CanvasRenderingContext2D, createCanvas } from 'canvas'
import getStroke from 'perfect-freehand'

export const SIGNATURE_STROKE_SIZE = 8
export const SIGNATURE_STROKE_THINNING = 0.5
export const SIGNATURE_STROKE_SMOOTHING = 0.5
export const SIGNATURE_STROKE_STREAMLINE = 0.5

export const SIGNATURE_OUTPUT_PADDING_DEFAULT = 10
export const SIGNATURE_OUTPUT_STROKE_FILL_STYLE = 'black'

export const BOX_HEIGHT_DEFAULT = 1
export const BOX_WIDTH_DEFAULT = 1

export const SIGNATURE_CAPTURED_STRING = 'Signature captured'

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

const drawStroke = (ctx: CanvasRenderingContext2D, stroke: number[][]) => {
  if (!stroke.length) return
  ctx.beginPath()
  ctx.moveTo(stroke[0][0], stroke[0][1])
  for (let i = 1; i < stroke.length; i++) {
    ctx.lineTo(stroke[i][0], stroke[i][1])
  }
  ctx.closePath()
  ctx.fill()
}

const convertToSignaturePngBuffer = (
  vectorArray: SignatureVectorArray,
  padding = SIGNATURE_OUTPUT_PADDING_DEFAULT,
): Buffer => {
  if (vectorArray.length === 0) return Buffer.alloc(0)

  // Calculate bounding box
  const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray)
  const boxWidth = maxX - minX || BOX_WIDTH_DEFAULT
  const boxHeight = maxY - minY || BOX_HEIGHT_DEFAULT

  // default dpr to 3 for overall sharpness
  const dpr = 3
  // Canvas size includes padding on all sides
  const canvasWidth = (boxWidth + 2 * padding) * dpr
  const canvasHeight = (boxHeight + 2 * padding) * dpr

  const canvas = createCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext('2d')

  // Scale the context to account for dpr
  ctx.scale(dpr, dpr)
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Draw strokes
  for (const stroke of vectorArray) {
    if (stroke.length === 0) continue
    const normalizedStroke = stroke.map(([x, y, pressure]) => [
      x - minX + padding,
      y - minY + padding,
      pressure,
    ])
    const pathData = getStroke(normalizedStroke, {
      size: SIGNATURE_STROKE_SIZE,
      thinning: SIGNATURE_STROKE_THINNING,
      smoothing: SIGNATURE_STROKE_SMOOTHING,
      streamline: SIGNATURE_STROKE_STREAMLINE,
    })

    ctx.fillStyle = SIGNATURE_OUTPUT_STROKE_FILL_STYLE
    drawStroke(ctx, pathData)
  }

  // Return PNG buffer
  return canvas.toBuffer('image/png')
}

export const convertToSignaturePngDataUri = (
  vectorArray: SignatureVectorArray,
): string => {
  const pngBuffer: Buffer = convertToSignaturePngBuffer(vectorArray)

  const base64 = pngBuffer.toString('base64')
  return `data:image/png;base64,${base64}`
}
