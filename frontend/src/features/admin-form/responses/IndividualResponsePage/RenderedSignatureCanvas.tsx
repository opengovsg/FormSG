import { useEffect, useRef, useState } from 'react'
import { Box } from '@chakra-ui/react'
import getStroke from 'perfect-freehand'

import { SignatureVectorArray } from '~shared/types'
import {
  convertToSignatureVectorArray,
  getBoundingBox,
  SIGNATURE_OUTPUT_PADDING_DEFAULT,
  SIGNATURE_STROKE_SIZE,
  SIGNATURE_STROKE_SMOOTHING,
  SIGNATURE_STROKE_STREAMLINE,
  SIGNATURE_STROKE_THINNING,
} from '~shared/utils/signature'

import { drawStroke } from '~utils/convertSignatureOutput'

import { DecryptedRowBaseProps } from './DecryptedRow'
import { useMeasure } from '~hooks/useMeasure'

interface RenderedSignatureCanvasSizeProps {
  /**
   * Size of the signature in pixels.
   * If not provided, the signature will be scaled to fit the container.
   */
  widthPx: number
}

export const RenderedSignatureCanvas = ({
  row,
  widthPx,
}: DecryptedRowBaseProps & RenderedSignatureCanvasSizeProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [containerRef, { width: containerWidth }] = useMeasure<HTMLDivElement>()
  const [img, setImg] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const vectorArray: SignatureVectorArray =
      row.answerArray && row.answerArray[1]
        ? convertToSignatureVectorArray(row.answerArray[1] as string)
        : []

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (vectorArray.length === 0) {
      // No signature - shrink canvas to minimal size
      canvas.width = 0
      canvas.height = 0
      return
    }

    const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray)
    const padding = SIGNATURE_OUTPUT_PADDING_DEFAULT

    // apply devicePixelRatio to maintain sharpness
    const dpr = window.devicePixelRatio || 1
    canvas.width = maxX * dpr
    canvas.height = maxY * dpr
    // keep the CSS size same as logical size
    canvas.style.width = `${maxX}px`
    canvas.style.height = `${maxY}px`

    // Scale the context to account for dpr
    ctx.scale(dpr, dpr)

    // Draw strokes using original coordinates but shift by minX and minY to remove whitespace
    vectorArray.forEach((stroke) => {
      const shiftedStroke = stroke.map(([x, y, pressure]) => [
        x - minX + padding,
        y - minY + padding,
        pressure,
      ])
      const pathData = getStroke(shiftedStroke, {
        size: SIGNATURE_STROKE_SIZE,
        thinning: SIGNATURE_STROKE_THINNING,
        smoothing: SIGNATURE_STROKE_SMOOTHING,
        streamline: SIGNATURE_STROKE_STREAMLINE,
      })
      drawStroke(ctx, pathData)
    })

    // Convert to image so that it is responsive to screen size and
    // maintains sharpness of original canvas
    const img = canvas.toDataURL('image/png', 1)
    setImg(img)
  }, [row.answerArray])

  return (
    <Box
      ref={containerRef}
      background="white"
      width={widthPx ?? '100%'}
      borderColor="neutral.400"
      borderRadius="0.25rem"
    >
      {img && <img width={widthPx ?? containerWidth} src={img} />}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Box>
  )
}
