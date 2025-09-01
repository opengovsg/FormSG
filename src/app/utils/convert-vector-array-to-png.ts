import { CanvasRenderingContext2D, createCanvas } from 'canvas'
import getStroke from 'perfect-freehand'
import { SignatureVectorArray } from 'shared/types'

import {
  BOX_HEIGHT_DEFAULT,
  BOX_WIDTH_DEFAULT,
  getBoundingBox,
  SIGNATURE_OUTPUT_PADDING_DEFAULT,
  SIGNATURE_OUTPUT_STROKE_FILL_STYLE,
  SIGNATURE_STROKE_SIZE,
  SIGNATURE_STROKE_SMOOTHING,
  SIGNATURE_STROKE_STREAMLINE,
  SIGNATURE_STROKE_THINNING,
} from '../../../shared/utils/signature'

export const convertToSignaturePngBuffer = (
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

export const convertToSignaturePngDataUri = (
  vectorArray: SignatureVectorArray,
): string => {
  const pngBuffer: Buffer = convertToSignaturePngBuffer(vectorArray)

  const base64 = pngBuffer.toString('base64')
  return `data:image/png;base64,${base64}`
}
