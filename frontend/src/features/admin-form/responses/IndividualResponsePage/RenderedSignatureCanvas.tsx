import { useEffect, useRef, useState, useCallback } from 'react'
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [availableWidth, setAvailableWidth] = useState<number | null>(null)

  // Function to measure available width
  const measureAvailableWidth = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth
      setAvailableWidth(width)
    }
  }, [])

  // Effect to measure available width on mount and resize
  useEffect(() => {
    measureAvailableWidth()
    
    const resizeObserver = new ResizeObserver(() => {
      measureAvailableWidth()
    })
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [measureAvailableWidth])

  useEffect(() => {
    const vectorArray: SignatureVectorArray = row.answerArray
      ? convertToSignatureVectorArray(row.answerArray[1] as string)
      : []

    const canvas = canvasRef.current
    if (!canvas || vectorArray.length === 0) return

    const { minX, minY, maxX, maxY } = getBoundingBox(vectorArray)

    // Calculate scale factor based on available width
    const originalWidth = maxX - minX + SIGNATURE_OUTPUT_PADDING_DEFAULT * 2
    const originalHeight = maxY - minY + SIGNATURE_OUTPUT_PADDING_DEFAULT * 2
    
    // Use availableWidth to scale the signature
    const scaleFactor = availableWidth ? Math.min(1, availableWidth / originalWidth) : 1
    
    const scaledWidth = originalWidth * scaleFactor
    const scaledHeight = originalHeight * scaleFactor

    // apply devicePixelRatio to maintain sharpness
    const dpr = window.devicePixelRatio || 1
    canvas.width = scaledWidth * dpr
    canvas.height = scaledHeight * dpr

    // keep the CSS size same as logical size
    canvas.style.width = `${scaledWidth}px`
    canvas.style.height = `${scaledHeight}px`

    const padding = SIGNATURE_OUTPUT_PADDING_DEFAULT

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Scale the context to account for dpr and scale factor
    ctx.scale(dpr * scaleFactor, dpr * scaleFactor)
    ctx.clearRect(0, 0, originalWidth, originalHeight)

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
  }, [row.answerArray, availableWidth])

  return (
    <Box
      ref={containerRef}
      background="white"
      width="100%"
      borderColor="neutral.400"
      borderRadius="0.25rem"
    >
      <canvas 
        ref={canvasRef} 
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          display: 'block'
        }} 
      />
    </Box>
  )
}
