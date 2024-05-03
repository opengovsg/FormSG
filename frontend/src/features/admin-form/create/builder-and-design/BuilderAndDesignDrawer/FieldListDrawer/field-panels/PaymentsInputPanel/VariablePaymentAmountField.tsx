import { Controller, RegisterOptions, UseFormReturn } from 'react-hook-form'
import { FormControl, HStack } from '@chakra-ui/react'
import {
  FormErrorMessage,
  FormLabel,
  Input,
} from '@opengovsg/design-system-react'

import {
  centsToDollars,
  dollarsToCents,
  formatCurrency,
} from '~shared/utils/payments'

import { usePaymentFieldValidation } from '~hooks/usePaymentFieldValidation'

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
      maxPaymentAmountCents: envMaxPaymentAmountCents = Number.MAX_SAFE_INTEGER,
      minPaymentAmountCents: envMinPaymentAmountCents = Number.MIN_SAFE_INTEGER,
    } = {},
  } = useEnv()

  const minAmountCents =
    input.global_min_amount_override || envMinPaymentAmountCents

  const maxAmountCents = envMaxPaymentAmountCents

  const minAmountInDollars = `S${formatCurrency(
    Number(centsToDollars(minAmountCents)),
  )}`
  const maxAmountInDollars = `S${formatCurrency(
    Number(centsToDollars(maxAmountCents)),
  )}`

  const minAmountValidation: RegisterOptions<
    FormPaymentsInput,
    typeof MIN_FIELD_KEY
  > = usePaymentFieldValidation<FormPaymentsInput, typeof MIN_FIELD_KEY>({
    lesserThanCents: dollarsToCents(input[MAX_FIELD_KEY] || ''),
    msgWhenEmpty: `The minimum amount is ${minAmountInDollars}`,
    overrideMinAmount: input.global_min_amount_override,
  })
  const maxAmountValidation: RegisterOptions<
    FormPaymentsInput,
    typeof MAX_FIELD_KEY
  > = usePaymentFieldValidation<FormPaymentsInput, typeof MAX_FIELD_KEY>({
    greaterThanCents: dollarsToCents(input[MIN_FIELD_KEY] || ''),
    msgWhenEmpty: `The maximum amount is ${maxAmountInDollars}`,
  })
  return (
    <FormControl
      isReadOnly={isLoading}
      // these invalid checks are required to trigger FormErrorMessage to display
      isInvalid={!!errors[MIN_FIELD_KEY]?.message || !!errors[MAX_FIELD_KEY]}
      isDisabled={isDisabled}
    >
      <FormLabel
        isRequired
        description="Set the minimum and maximum amounts respondents can pay"
      >
        Payment amount limit
      </FormLabel>
      <HStack>
        <FormControl
          isInvalid={!!errors[MIN_FIELD_KEY]}
          isDisabled={isDisabled}
        >
          <FormLabel isRequired>Minimum amount</FormLabel>
          <Controller
            name={MIN_FIELD_KEY}
            control={control}
            rules={minAmountValidation}
            render={({ field }) => (
              <Input
                flex={1}
                step={0}
                inputMode="decimal"
                placeholder={minAmountInDollars}
                {...field}
              />
            )}
          />
        </FormControl>
        <FormControl
          isInvalid={!!errors[MAX_FIELD_KEY]}
          isDisabled={isDisabled}
        >
          <FormLabel isRequired>Maximum amount</FormLabel>
          <Controller
            name={MAX_FIELD_KEY}
            control={control}
            rules={maxAmountValidation}
            render={({ field }) => (
              <Input
                flex={1}
                step={0}
                inputMode="decimal"
                placeholder={maxAmountInDollars}
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
