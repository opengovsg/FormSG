import { useMemo } from 'react'
import { BiCheck } from 'react-icons/bi'
import { Box, Stack } from '@chakra-ui/react'

import { FormColorTheme } from '~shared/types'
import { BasicField, FormFieldWithId } from '~shared/types/field'

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
  colorTheme = FormColorTheme.Blue,
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

  const verifyButtonAriaLabel: string = useMemo(() => {
    switch (schema.fieldType) {
      case BasicField.Email:
        return hasSignature
          ? 'Given email address is verified'
          : 'Verify email address'
      case BasicField.Mobile:
        return hasSignature
          ? 'Given mobile number is verified'
          : 'Verify mobile number'
    }
  }, [hasSignature, schema.fieldType])

  return (
    <Box>
      <FieldContainer schema={schema}>
        <Stack spacing="0.5rem" direction={{ base: 'column', md: 'row' }}>
          {children}
          <Box>
            <Button
              // Bad a11y to disable buttons since screen readers act as if buttons
              // are removed from DOM if the button is disabled.
              // Instead, we allow users to click the button to trigger verification
              name={`${schema._id}-verify`}
              isDisabled={isVfnBoxOpen || hasSignature}
              isLoading={isSendingOtp}
              onClick={handleVfnButtonClick}
              colorScheme={`theme-${colorTheme}`}
              leftIcon={
                hasSignature ? <BiCheck fontSize="1.5rem" /> : undefined
              }
              aria-label={verifyButtonAriaLabel}
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
