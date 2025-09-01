import getStroke from 'perfect-freehand'

import { SignatureVectorArray } from '~shared/types'
import {
  BOX_HEIGHT_DEFAULT,
  BOX_WIDTH_DEFAULT,
  getBoundingBox,
  SIGNATURE_OUTPUT_PADDING_DEFAULT,
  SIGNATURE_STROKE_SIZE,
  SIGNATURE_STROKE_SMOOTHING,
  SIGNATURE_STROKE_STREAMLINE,
  SIGNATURE_STROKE_THINNING,
} from '~shared/utils/signature'

export const drawStroke = (
  ctx: CanvasRenderingContext2D,
  points: number[][],
): void => {
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])

  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i]
    ctx.lineTo(x, y)
  }

  ctx.closePath()
  ctx.fill()
}

export const convertToSignatureSvgString = (
  vectorArray: SignatureVectorArray,
  padding = SIGNATURE_OUTPUT_PADDING_DEFAULT,
  dpr = 3,
): string => {
  if (vectorArray.length === 0) return ''

  const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray)
  const boxWidth = maxX - minX || BOX_WIDTH_DEFAULT
  const boxHeight = maxY - minY || BOX_HEIGHT_DEFAULT

  const canvasWidth = boxWidth + 2 * padding
  const canvasHeight = boxHeight + 2 * padding

  const paths = vectorArray.map((stroke) => {
    if (stroke.length === 0) return ''

    const normalizedStroke = stroke.map(([x, y, pressure]) => [
      (x - minX + padding) * dpr,
      (y - minY + padding) * dpr,
      pressure,
    ])

    const strokePoints = getStroke(normalizedStroke, {
      size: SIGNATURE_STROKE_SIZE * dpr,
      thinning: SIGNATURE_STROKE_THINNING,
      smoothing: SIGNATURE_STROKE_SMOOTHING,
      streamline: SIGNATURE_STROKE_STREAMLINE,
    })

    if (strokePoints.length === 0) return ''

    const pathData = strokePoints
      .map(([x, y], i) =>
        i === 0
          ? `M ${x.toFixed(2)} ${y.toFixed(2)}`
          : `L ${x.toFixed(2)} ${y.toFixed(2)}`,
      )
      .join(' ')

    return `<path d="${pathData} Z" fill="black" />`
  })

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${canvasWidth}" height="${canvasHeight}"
         viewBox="0 0 ${canvasWidth * dpr} ${canvasHeight * dpr}">
      <rect width="100%" height="100%" fill="white" />
      ${paths.join('\n')}
    </svg>
  `.trim()

  return svg
}
