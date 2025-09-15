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

export const RenderedSignatureCanvas = ({
  row,
}: DecryptedRowBaseProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const vectorArray: SignatureVectorArray = row.answerArray
      ? convertToSignatureVectorArray(row.answerArray[1] as string)
      : []

    const canvas = canvasRef.current
    if (!canvas || vectorArray.length === 0) return

    const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray)

    // apply devicePixelRatio to maintain sharpness
    const dpr = window.devicePixelRatio || 1
    canvas.width = maxX * dpr
    canvas.height = maxY * dpr

    // keep the CSS size same as logical size
    canvas.style.width = `${maxX}px`
    canvas.style.height = `${maxY}px`

    const padding = SIGNATURE_OUTPUT_PADDING_DEFAULT
    setCanvasSize({ width: maxX, height: maxY })

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Scale the context to account for dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, maxX - minX + padding * 2, maxY - minY + padding * 2)

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
  }, [row.answerArray])

  return (
    <Box
      background="white"
      width={`${canvasSize.width}px`}
      height={`${canvasSize.height}px`}
      borderColor="neutral.400"
      borderRadius="0.25rem"
    >
      <canvas ref={canvasRef} />
    </Box>
  )
}
