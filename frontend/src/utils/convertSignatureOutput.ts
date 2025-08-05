import getStroke from 'perfect-freehand'

import {
  getBoundingBox,
  signatureOutputPaddingDefault,
  signatureStrokeSize,
  signatureStrokeSmoothing,
  signatureStrokeStreamline,
  signatureStrokeThinning,
} from '~shared/utils/signature'

const DEFAULT_BOX_HEIGHT = 1
const DEFAULT_BOX_WIDTH = 1

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
  vectorArray: [number, number, number][][],
  padding = signatureOutputPaddingDefault,
): string => {
  if (vectorArray.length === 0) return ''

  const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray)
  const boxWidth = maxX - minX || DEFAULT_BOX_HEIGHT
  const boxHeight = maxY - minY || DEFAULT_BOX_WIDTH

  const canvasWidth = boxWidth + 2 * padding
  const canvasHeight = boxHeight + 2 * padding

  const paths = vectorArray.map((stroke) => {
    if (stroke.length === 0) return ''

    const normalizedStroke = stroke.map(([x, y, pressure]) => [
      x - minX + padding,
      y - minY + padding,
      pressure,
    ])

    const strokePoints = getStroke(normalizedStroke, {
      size: signatureStrokeSize,
      thinning: signatureStrokeThinning,
      smoothing: signatureStrokeSmoothing,
      streamline: signatureStrokeStreamline,
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
         viewBox="0 0 ${canvasWidth} ${canvasHeight}">
      <rect width="100%" height="100%" fill="white" />
      ${paths.join('\n')}
    </svg>
  `.trim()

  return svg
}
