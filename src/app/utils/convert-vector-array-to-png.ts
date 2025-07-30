import { CanvasRenderingContext2D, createCanvas } from 'canvas'
import getStroke from 'perfect-freehand'
import fs from 'fs'
import { getBoundingBox, signatureOutputPaddingDefault, signatureOutputStrokeFillStyle, signatureStrokeSize, signatureStrokeSmoothing, signatureStrokeStreamline, signatureStrokeThinning } from '../../../shared/utils/signature'

export const convertToSignaturePngBuffer = (
    vectorArray: [number, number, number][][],
    padding = signatureOutputPaddingDefault,
): Buffer => {
  if (vectorArray.length === 0) return Buffer.alloc(0)
    
  // Calculate bounding box
  const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray)
  const boxWidth = maxX - minX || 1
  const boxHeight = maxY - minY || 1

  // Canvas size includes padding on all sides
  const canvasWidth = boxWidth + 2 * padding
  const canvasHeight = boxHeight + 2 * padding

  const canvas = createCanvas(canvasWidth, canvasHeight)
  const ctx = canvas.getContext('2d')

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
    size: signatureStrokeSize,
    thinning: signatureStrokeThinning,
    smoothing: signatureStrokeSmoothing,
    streamline: signatureStrokeStreamline,
    })

    ctx.fillStyle = signatureOutputStrokeFillStyle
    drawStroke(ctx, pathData)
  }

  // Return PNG buffer
  return canvas.toBuffer('image/png')
}

// duplicated function from signature.ts since BE uses canvas from BE package
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