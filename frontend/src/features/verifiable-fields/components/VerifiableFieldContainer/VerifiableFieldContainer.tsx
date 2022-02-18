import { BiCheck } from 'react-icons/bi'
import { Box, Stack } from '@chakra-ui/react'

import { FormFieldWithId } from '~shared/types/field'

import Button from '~components/Button'
import { BaseFieldProps, FieldContainer } from '~templates/Field/FieldContainer'

import { VerifiableFieldBase, VerifiableFieldSchema } from '../../types'
import { useVerifiableField } from '../../VerifiableFieldContext'
import { VerificationBox } from '../VerificationBox'

export interface BaseVerifiableFieldProps extends BaseFieldProps {
  schema: VerifiableFieldSchema<FormFieldWithId<VerifiableFieldBase>>
}

export interface VerifiableFieldContainerProps
  extends BaseVerifiableFieldProps {
  children: React.ReactNode
}

/**
 * @precondition Must have a parent `react-hook-form#FormProvider` and `VerifiableFieldProvider` component.
 */
export const VerifiableFieldContainer = ({
  schema,
  questionNumber,
  children,
}: VerifiableFieldContainerProps): JSX.Element => {
  const {
    isVfnBoxOpen,
    handleVfnButtonClick,
    hasSignature,
    handleVerifyOtp,
    handleResendOtp,
    isSendingOtp,
  } = useVerifiableField()

  return (
    <Box>
      <FieldContainer schema={schema} questionNumber={questionNumber}>
        <Stack spacing="0.5rem" direction={{ base: 'column', md: 'row' }}>
          {children}
          <Box>
            <Button
              isDisabled={isVfnBoxOpen || hasSignature}
              isLoading={isSendingOtp}
              onClick={handleVfnButtonClick}
              leftIcon={
                hasSignature ? <BiCheck fontSize="1.5rem" /> : undefined
              }
            >
              {hasSignature ? 'Verified' : 'Verify'}
            </Button>
          </Box>
        </Stack>
      </FieldContainer>
      {isVfnBoxOpen && (
        <VerificationBox
          handleVerifyOtp={handleVerifyOtp}
          handleResendOtp={handleResendOtp}
          fieldType={schema.fieldType}
        />
      )}
    </Box>
  )
}
