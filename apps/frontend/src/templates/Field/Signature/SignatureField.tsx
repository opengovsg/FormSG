import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Controller,
  FieldErrors,
  useFormContext,
  useFormState,
} from 'react-hook-form'
import { Box, Flex, FormControl, Stack, Text } from '@chakra-ui/react'
import getStroke from 'perfect-freehand'

import { SignatureVectorArray } from 'formsg-shared/types'
import {
  SIGNATURE_STROKE_SIZE,
  SIGNATURE_STROKE_SMOOTHING,
  SIGNATURE_STROKE_STREAMLINE,
  SIGNATURE_STROKE_THINNING,
} from 'formsg-shared/utils/signature'

import { createSignatureValidationRules } from '~utils/fieldValidation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { BaseFieldProps } from '../FieldContainer'
import {
  SignatureFieldInput,
  SignatureFieldSchema,
  SignatureFieldValues,
} from '../types'

export interface SignatureFieldProps extends BaseFieldProps {
  schema: SignatureFieldSchema
  disableRequiredValidation?: boolean
}

export interface SignatureCanvasProps {
  schema: SignatureFieldSchema
  isHighContrast?: boolean
  isSubmitting: boolean
  isValid: boolean
  errors: FieldErrors<SignatureFieldInput>
  value: SignatureFieldValues | null
  onChange: (value: SignatureFieldValues) => void
}

const SignatureCanvas = ({
  schema,
  isHighContrast,
  isSubmitting,
  isValid,
  errors,
  value,
  onChange,
}: SignatureCanvasProps) => {
  const signatureErrors = errors?.[schema._id]
  const [showSignaturePlaceholder, setShowSignaturePlaceholder] = useState(true)

  const placeholderString = useMemo(() => {
    if (schema.disabled) {
      return 'Signatures are disabled for you'
    }
    return 'Draw your signature here'
  }, [schema.disabled])

  // Future implementations will expand on signature types (text, cryptographic)
  const defaultType = 'draw'
  const strokePressureDefault = 0.5

  // perfect freehand variables
  const pfCanvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const [pfStrokes, setPfStrokes] = useState<SignatureVectorArray>([])

  // Sync pfStrokes with form value when it changes externally
  useEffect(() => {
    if (value?.value) {
      setPfStrokes(value.value)
      if (value.value.length > 0) {
        setShowSignaturePlaceholder(false)
      }
    }
  }, [value])

  const [currentStroke, setCurrentStroke] = useState<
    [number, number, number][]
  >([])
  const [isDrawing, setIsDrawing] = useState(false)

  const drawAllStrokes = useCallback(() => {
    const canvas = pfCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'black'

    for (const strokePoints of pfStrokes) {
      const stroke = getStroke(strokePoints, {
        size: SIGNATURE_STROKE_SIZE,
        thinning: SIGNATURE_STROKE_THINNING,
        smoothing: SIGNATURE_STROKE_SMOOTHING,
        streamline: SIGNATURE_STROKE_STREAMLINE,
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
  }, [pfStrokes])

  // resize canvas
  useEffect(() => {
    const canvas = pfCanvasRef.current
    const container = boxRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1

      // Set the internal canvas resolution based on device pixel ratio
      canvas.width = width * dpr
      canvas.height = height * dpr

      // Scale the drawing context so everything is rendered crisply
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      drawAllStrokes()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [drawAllStrokes])

  // draw signature
  useEffect(() => {
    const canvas = pfCanvasRef.current
    if (!canvas) return

    if (pfStrokes.length > 0) {
      drawAllStrokes()
      setShowSignaturePlaceholder(false)
    }

    const handlePointerDown = (e: PointerEvent) => {
      setShowSignaturePlaceholder(false)
      setIsDrawing(true)
      const newStroke: [number, number, number][] = [
        [e.offsetX, e.offsetY, e.pressure || strokePressureDefault],
      ]
      setCurrentStroke(newStroke)
      setPfStrokes((prev) => [...prev, newStroke])
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDrawing) return
      setCurrentStroke((prev) => {
        const newPoint = [
          e.offsetX,
          e.offsetY,
          e.pressure || strokePressureDefault,
        ] as [number, number, number]
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
      if (!isDrawing) return
      setIsDrawing(false)
      onChange({ type: defaultType, value: pfStrokes })
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointerleave', handlePointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointerleave', handlePointerUp)
    }
  }, [drawAllStrokes, isDrawing, pfStrokes, defaultType, onChange])

  const handleClearPerfectFreehandSignature = async () => {
    setShowSignaturePlaceholder(true)
    setPfStrokes([])
    onChange({ type: defaultType, value: [] })
    const canvas = pfCanvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
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
        isInvalid={!!signatureErrors}
      >
        <Stack direction="column" gap={0.5} marginBottom="1.5rem">
          <Flex direction="row" gap={2} justify="space-between" width="100%">
            <Stack width="100%">
              {/* perfect freehand component */}
              <Box
                ref={boxRef}
                background={schema.disabled ? 'neutral.200' : 'neutral.100'}
                width="100%"
                maxWidth="100%"
                height="11.125rem"
                border="1px solid"
                borderRadius="0.25rem"
                cursor={schema.disabled ? 'not-allowed' : 'auto'}
                borderColor={
                  signatureErrors
                    ? 'red.600'
                    : isDrawing
                      ? '#445fcd'
                      : 'neutral.400'
                }
                position="relative"
                overflow="hidden"
                _hover={{
                  background: schema.disabled ? 'neutral.200' : 'primary.100',
                  outline: isDrawing ? '2px solid #445fcd' : 'none',
                }}
              >
                {showSignaturePlaceholder && (
                  <Flex
                    width="100%"
                    maxWidth="100%"
                    height="11.125rem"
                    top={0}
                    left={0}
                    position="absolute"
                    pointerEvents="none"
                    align="center"
                    justify="center"
                  >
                    <Text color="#A0A4AD">{placeholderString}</Text>
                  </Flex>
                )}
                <Box
                  pointerEvents={schema.disabled ? 'none' : 'auto'} // disable canvas interaction
                  width="100%"
                  height="100%"
                  // contentEditable marks this as an interactive element for
                  // @hello-pangea/dnd, preventing drag initiation from the canvas
                  contentEditable={!schema.disabled}
                  suppressContentEditableWarning
                  sx={{ cursor: 'default' }}
                >
                  <canvas
                    ref={pfCanvasRef}
                    aria-label={`Signature field ${schema._id}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'block',
                      touchAction: 'none',
                    }}
                  />
                </Box>
              </Box>
            </Stack>
          </Flex>
          {schema.disabled ? null : (
            <Flex justify="space-between" mt="0.5rem" align="flex-start">
              {signatureErrors?.message ? (
                <FormErrorMessage mt="0">
                  {signatureErrors.message}
                </FormErrorMessage>
              ) : (
                <Box /> // placeholder to consistently flush button to the right
              )}
              <Button
                onClick={() => {
                  handleClearPerfectFreehandSignature()
                }}
                isLoading={isSubmitting}
                isDisabled={schema.disabled}
                variant={'clear'}
              >
                Clear
              </Button>
            </Flex>
          )}
        </Stack>
      </FormControl>
    </Box>
  )
}

export const SignatureField = ({
  schema,
  disableRequiredValidation,
  isHighContrast,
}: SignatureFieldProps): JSX.Element => {
  const { control } = useFormContext<SignatureFieldInput>()
  const { isSubmitting, isValid, errors } = useFormState<SignatureFieldInput>()

  const signatureValidationRules = useMemo(
    () => createSignatureValidationRules(schema, disableRequiredValidation),
    [schema, disableRequiredValidation],
  )

  return (
    <Controller
      control={control}
      name={schema._id}
      rules={signatureValidationRules}
      render={({ field }) => (
        <SignatureCanvas
          schema={schema}
          isHighContrast={isHighContrast}
          isSubmitting={isSubmitting}
          isValid={isValid}
          errors={errors}
          value={field.value}
          onChange={field.onChange}
        />
      )}
    />
  )
}
