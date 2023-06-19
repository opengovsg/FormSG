import { Controller, RegisterOptions, UseFormReturn } from 'react-hook-form'
import { FormControl } from '@chakra-ui/react'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import MoneyInput from '~components/MoneyInput'

import { usePaymentFieldValidation } from '~features/public-form/components/FormPaymentPage/queries'

import { FormPaymentsInput } from './PaymentsInputPanel'

const DISPLAY_AMOUNT_FIELD_KEY = 'display_amount'
export const FixedPaymentAmountField = ({
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
  const amountValidation: RegisterOptions<
    FormPaymentsInput,
    typeof DISPLAY_AMOUNT_FIELD_KEY
  > = usePaymentFieldValidation<
    FormPaymentsInput,
    typeof DISPLAY_AMOUNT_FIELD_KEY
  >()
  return (
    <FormControl
      isReadOnly={isLoading}
      isDisabled={isDisabled}
      isInvalid={!!errors[DISPLAY_AMOUNT_FIELD_KEY]}
      isRequired
    >
      <FormLabel isRequired description="Amount should include GST">
        Payment amount
      </FormLabel>
      <Controller
        name={DISPLAY_AMOUNT_FIELD_KEY}
        control={control}
        rules={amountValidation}
        render={({ field }) => (
          <MoneyInput
            flex={1}
            step={0}
            inputMode="decimal"
            placeholder="0.00"
            {...field}
          />
        )}
      />
      <FormErrorMessage>
        {errors[DISPLAY_AMOUNT_FIELD_KEY]?.message}
      </FormErrorMessage>
      {Number(input[DISPLAY_AMOUNT_FIELD_KEY]) > 1000 ? (
        <InlineMessage variant="warning" mt="2rem" useMarkdown>
          You would need to issue your own invoice for amounts above S$1000.
          [Learn more about
          this](https://guide.form.gov.sg/faq/faq/payments#simplified-tax-invoices-versus-regular-tax-invoices)
        </InlineMessage>
      ) : null}
    </FormControl>
  )
}
