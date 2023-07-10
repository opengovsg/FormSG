import { Controller, RegisterOptions, UseFormReturn } from 'react-hook-form'
import { FormControl, HStack } from '@chakra-ui/react'

import { usePaymentFieldValidation } from '~hooks/usePaymentFieldValidation'
import { centsToDollars, dollarsToCents, formatCurrency } from '~utils/payments'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

import { useEnv } from '~features/env/queries'

import { FormPaymentsInput } from './PaymentsInputPanel'

const MIN_FIELD_KEY = `display_min_amount`
const MAX_FIELD_KEY = `display_max_amount`
export const VariablePaymentAmountField = ({
  isLoading,
  errors,
  isDisabled,
  control,
  input,
}: {
  isLoading: boolean
  isDisabled: boolean
  errors: UseFormReturn<FormPaymentsInput>['formState']['errors']
  control: UseFormReturn<FormPaymentsInput>['control']
  input: FormPaymentsInput
}) => {
  const {
    data: {
      maxPaymentAmountCents = Number.MAX_SAFE_INTEGER,
      minPaymentAmountCents = Number.MIN_SAFE_INTEGER,
    } = {},
  } = useEnv()
  const minAmountValidation: RegisterOptions<
    FormPaymentsInput,
    typeof MIN_FIELD_KEY
  > = usePaymentFieldValidation<FormPaymentsInput, typeof MIN_FIELD_KEY>({
    lesserThanCents: dollarsToCents(input[MAX_FIELD_KEY] || ''),
    msgWhenEmpty: `The minimum amount is S${formatCurrency(
      Number(centsToDollars(minPaymentAmountCents)),
    )}`,
  })
  const maxAmountValidation: RegisterOptions<
    FormPaymentsInput,
    typeof MAX_FIELD_KEY
  > = usePaymentFieldValidation<FormPaymentsInput, typeof MAX_FIELD_KEY>({
    greaterThanCents: dollarsToCents(input[MIN_FIELD_KEY] || ''),
    msgWhenEmpty: `The maximum amount is S${formatCurrency(
      Number(centsToDollars(maxPaymentAmountCents)),
    )}`,
  })
  return (
    <FormControl
      isReadOnly={isLoading}
      // these invalid checks are required to trigger FormErrorMessage to display
      isInvalid={!!errors[MIN_FIELD_KEY]?.message || !!errors[MAX_FIELD_KEY]}
    >
      <FormLabel
        isRequired
        description="Customise the amount that respondents are allowed to define"
      >
        Payment amount limit
      </FormLabel>
      <HStack>
        <FormControl
          isInvalid={!!errors[MIN_FIELD_KEY]}
          isDisabled={isDisabled}
        >
          <FormLabel isRequired>Minimum Amount</FormLabel>
          <Controller
            name={MIN_FIELD_KEY}
            control={control}
            rules={minAmountValidation}
            render={({ field }) => (
              <Input
                flex={1}
                step={0}
                inputMode="decimal"
                placeholder="S$0.50"
                {...field}
              />
            )}
          />
        </FormControl>
        <FormControl
          isInvalid={!!errors[MAX_FIELD_KEY]}
          isDisabled={isDisabled}
        >
          <FormLabel isRequired>Maximum Amount</FormLabel>
          <Controller
            name={MAX_FIELD_KEY}
            control={control}
            rules={maxAmountValidation}
            render={({ field }) => (
              <Input
                flex={1}
                step={0}
                inputMode="decimal"
                placeholder="S$1,000,000"
                {...field}
              />
            )}
          />
        </FormControl>
      </HStack>
      <FormErrorMessage>{errors[MIN_FIELD_KEY]?.message}</FormErrorMessage>
      <FormErrorMessage>{errors[MAX_FIELD_KEY]?.message}</FormErrorMessage>
    </FormControl>
  )
}
