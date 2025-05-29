import { useRef, useState } from 'react'
import { Controller, useFormContext, useFormState } from 'react-hook-form'
import SignatureCanvas from 'react-signature-canvas'
import { Box, Flex, FormControl, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { BaseFieldProps } from '../FieldContainer'
import { FieldInput, SignatureFieldSchema } from '../types'

export interface SignatureFieldProps extends BaseFieldProps {
  schema: SignatureFieldSchema
  disableRequiredValidation?: boolean
}

export type SignatureFieldInput = FieldInput<SignatureFieldValues>
export type SignatureFieldValues = {
  type: 'draw'
  value: string
} & {
  type: 'text' // TODO: unused, kept as example of extension
  value: string
}

export const SignatureField = ({
  schema,
  disableRequiredValidation,
  isHighContrast,
}: SignatureFieldProps): JSX.Element => {
  const formContext = useFormContext<SignatureFieldInput>()
  const { isSubmitting, isValid, errors } = useFormState<SignatureFieldInput>()

  const [showSignaturePlaceholder, setShowSignaturePlaceholder] = useState(true)

  const handleClearSignature = async () => {
    signatureRef.current?.clear()
    setShowSignaturePlaceholder(true)
  }

  const signatureRef = useRef<SignatureCanvas>(null)

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
      {/** Postal Code */}
      <FormControl
        isRequired={schema.required}
        isDisabled={schema.disabled}
        isReadOnly={isValid && isSubmitting}
        id={`${schema._id}-signature`}
        // isInvalid={!!addressSubFieldErrors?.postalCode}
      >
        {/* <FormLabel isRequired isHighContrast={isHighContrast}>
          Draw / Text
        </FormLabel> */}
        <Stack direction="column" gap={0.5} marginBottom="1.5rem">
          {/* <FormLabel>
                  Throttle 0, minDis: 1, veloFilterWeight: 0.3
                </FormLabel> */}
          <Flex direction="row" gap={2} justify="space-between" width="100%">
            {/* <Input
                    {...field}
                    aria-label={`${schema.questionNumber}. Draw??`}
                    placeholder="HAHAHAH"
                    isHighContrast={isHighContrast}
                  />
                  <Button
                    onClick={handleVerifyAddress}
                    isLoading={isSubmitting}
                    isDisabled={isButtonDisabled}
                    isHighContrast={isHighContrast}
                  >
                    Draw
                  </Button> */}

            <Box
              background="white"
              width="502px"
              height="202px"
              border="1px solid"
              borderColor="neutral.400"
              borderRadius="0.25rem"
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
              <SignatureCanvas
                ref={signatureRef}
                penColor="black"
                canvasProps={{
                  width: 500,
                  height: 200,
                  className: 'sigCanvas',
                }}
                throttle={0}
                minDistance={3}
                velocityFilterWeight={0.7}
                minWidth={2}
                maxWidth={2.5}
                onBegin={() => {
                  setShowSignaturePlaceholder(false)
                }}
                onEnd={() => {
                  // const sigDataUrl = signatureRef.current?.toDataURL()
                  // const sigData = signatureRef.current?.toData() ?? []
                }}
              />
            </Box>
          </Flex>
          <Box alignSelf="end" marginTop="0.5rem">
            <Button
              onClick={handleClearSignature}
              isLoading={isSubmitting}
              isHighContrast={isHighContrast}
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
