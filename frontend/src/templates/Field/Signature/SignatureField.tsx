import { useEffect, useRef, useState } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import { Box, Flex, FormControl, Stack, Text } from '@chakra-ui/react'
import getStroke from 'perfect-freehand'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { BaseFieldProps } from '../FieldContainer'
import { FieldInput, SignatureFieldInput, SignatureFieldSchema } from '../types'

export interface SignatureFieldProps extends BaseFieldProps {
  schema: SignatureFieldSchema
  disableRequiredValidation?: boolean
}

export const SignatureField = ({
  schema,
  disableRequiredValidation,
  isHighContrast,
}: SignatureFieldProps): JSX.Element => {
  const formContext = useFormContext<SignatureFieldInput>()
  const { getValues, setValue } = formContext
  const { isSubmitting, isValid, errors } = useFormState<SignatureFieldInput>()
  const [showSignaturePlaceholder, setShowSignaturePlaceholder] = useState(true)

  let vectorArray: [number, number, number][][] = []
  const preExistingSignature = getValues(`${schema._id}`)
  if (preExistingSignature) {
    vectorArray = preExistingSignature.value
  }

  // perfect freehand variables
  const pfCanvasRef = useRef<HTMLCanvasElement>(null)
  const [pfStrokes, setPfStrokes] =
    useState<[number, number, number][][]>(vectorArray)
  const [currentStroke, setCurrentStroke] = useState<
    [number, number, number][]
  >([])
  const [isDrawing, setIsDrawing] = useState(false)

  const drawAllStrokes = () => {
    const canvas = pfCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'black'

    for (const strokePoints of pfStrokes) {
      const stroke = getStroke(strokePoints, {
        size: 8,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
      })

      ctx.beginPath()
      if (stroke.length > 0) {
        ctx.moveTo(stroke[0][0], stroke[0][1])
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i][0], stroke[i][1])
        }
        ctx.closePath()
        ctx.fill()
      }
    }
  }

  useEffect(() => {
    const canvas = pfCanvasRef.current
    if (!canvas) return

    if (vectorArray.length > 0) {
      drawAllStrokes()
      setShowSignaturePlaceholder(false)
    }

    const handlePointerDown = (e: PointerEvent) => {
      setShowSignaturePlaceholder(false)
      setIsDrawing(true)
      const newStroke: [number, number, number][] = [
        [e.offsetX, e.offsetY, e.pressure || 0.5],
      ]
      setCurrentStroke(newStroke)
      setPfStrokes((prev) => [...prev, newStroke])
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDrawing) return
      setCurrentStroke((prev) => {
        const newPoint = [e.offsetX, e.offsetY, e.pressure || 0.5] as [
          number,
          number,
          number,
        ]
        const updated = [...prev, newPoint]
        setPfStrokes((prev) => [
          ...prev.slice(0, -1),
          updated as [number, number, number][],
        ])
        drawAllStrokes()
        return updated
      })
    }

    const handlePointerUp = () => {
      setIsDrawing(false)
      setValue(`${schema._id}`, { type: 'draw', value: pfStrokes })
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDrawing, pfStrokes])

  const handleClearPerfectFreehandSignature = async () => {
    // signatureRef.current?.clear()
    setShowSignaturePlaceholder(true)
    setPfStrokes([])
    const ctx = pfCanvasRef.current?.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, 500, 200)
  }

  return (
    <Box>
      <FormLabel
        isRequired={schema.required}
        questionNumber={
          schema.questionNumber ? `${schema.questionNumber}.` : undefined
        }
        description={schema.description}
        isHighContrast={isHighContrast}
      >
        {schema.title}
      </FormLabel>
      <FormControl
        isRequired={schema.required}
        isDisabled={schema.disabled}
        isReadOnly={isValid && isSubmitting}
        id={`${schema._id}`}
        // isInvalid={!!addressSubFieldErrors?.postalCode}
      >
        <Stack direction="column" gap={0.5} marginBottom="1.5rem">
          <Flex direction="row" gap={2} justify="space-between" width="100%">
            <Stack>
              {/* perfect freehand component */}
              <Box
                background="white"
                width="502px"
                height="202px"
                border="1px solid"
                borderColor="neutral.400"
                borderRadius="0.25rem"
                cursor={schema.disabled ? 'not-allowed' : 'auto'}
                opacity={schema.disabled ? 0.6 : 1} // optional: visual dim
              >
                {showSignaturePlaceholder && (
                  <Box
                    width="502px"
                    height="202px"
                    justifyItems="center"
                    alignContent="center"
                    position="absolute"
                    pointerEvents="none"
                  >
                    <Text color="#A0A4AD">Sign here</Text>
                  </Box>
                )}
                <Box
                  pointerEvents={schema.disabled ? 'none' : 'auto'} // 👈 this blocks canvas interaction
                  width="100%"
                  height="100%"
                >
                  <canvas
                    ref={pfCanvasRef}
                    width={500}
                    height={200}
                    style={{ touchAction: 'none' }}
                  />
                </Box>
                {/* Overlay for disabled state */}
                {/* {schema.disabled && (
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="100%"
                    backgroundColor="gray.500"
                    zIndex={1}
                    pointerEvents="auto"
                    cursor="not-allowed"
                  />
                )} */}
              </Box>
            </Stack>
          </Flex>
          <Box alignSelf="end" marginTop="0.5rem">
            <Button
              onClick={() => {
                // handleClearSignature()
                handleClearPerfectFreehandSignature()
              }}
              isLoading={isSubmitting}
              isHighContrast={isHighContrast}
              isDisabled={schema.disabled}
            >
              Clear
            </Button>
          </Box>
          <FormErrorMessage>{errors.draw?.message}</FormErrorMessage>
        </Stack>
      </FormControl>
    </Box>
  )
}
