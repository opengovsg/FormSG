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

const getHorizontallyFilled = ({
  maxX, 
  maxY, 
  availableWidth,
  dpr, 
}: {
  maxX: number
  maxY: number
  availableWidth: number
  dpr: number 
}) => {
  const logicalWidth = maxX * dpr
  const logicalHeight = maxY * dpr
  // The scaling factor is the ratio such that the signature fits within the available width. 
  const scalingFactor = Math.min(availableWidth / logicalWidth, 1) 
  const scaledWidth = logicalWidth * scalingFactor
  const scaledHeight = logicalHeight * scalingFactor

  const exceedsMax = scaledWidth > maxX

  if (exceedsMax) {
    // Then use the maximum 
    return {
      // Set the logical size to the scaled dpr size of the signature
      adjustedLogicalWidth: logicalWidth,
      adjustedLogicalHeight: logicalHeight,
      // Scale the context to account for dpr
      adjustedScalingFactor: dpr,
      // Set the size of the canvas to the maximum size of the signature 
      actualWidth: maxX,
      actualHeight: maxY
    }
  } else {
    return {
      // Set the logical size to the scaled dpr * scaling factor size of the signature
      adjustedLogicalWidth: scaledWidth,
      adjustedLogicalHeight: scaledHeight,
      // Scale the context to account for dpr and scaling factor
      adjustedScalingFactor: scalingFactor * dpr,
      actualWidth: scaledWidth,
      actualHeight: scaledHeight
    }
  }
}

export const RenderedSignatureCanvas = ({
  row,
}: DecryptedRowBaseProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [containerRef, { width: containerWidth }] = useMeasure<HTMLDivElement>()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

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
      setCanvasSize({ width: 0, height: 0 })
      return
    }

    const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray)

    const padding = SIGNATURE_OUTPUT_PADDING_DEFAULT
    // apply devicePixelRatio to maintain sharpness
    const dpr = window.devicePixelRatio || 1

    const { adjustedLogicalWidth, adjustedLogicalHeight, adjustedScalingFactor, actualWidth, actualHeight } = getHorizontallyFilled({
      maxX,
      maxY,
      availableWidth: containerWidth || 300,
      dpr
    })

    canvas.width = adjustedLogicalWidth 
    canvas.height = adjustedLogicalHeight

    canvas.style.width = `${actualWidth}px`
    canvas.style.height = `${actualHeight}px`

    ctx.scale(adjustedScalingFactor, adjustedScalingFactor)
    setCanvasSize({ width: actualWidth, height: actualHeight })

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
  }, [row.answerArray, containerWidth])

  return (
    <Box ref={containerRef} width="100%">
      <Box
        background="white"
        maxWidth="100%"
        width={`${canvasSize.width}px`}
        height={`${canvasSize.height}px`}
        borderColor="neutral.400"
        borderRadius="0.25rem"
      >
        <canvas ref={canvasRef} />
      </Box>
    </Box>
  )
}
