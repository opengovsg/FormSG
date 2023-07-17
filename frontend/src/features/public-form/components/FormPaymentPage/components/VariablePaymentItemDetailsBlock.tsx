import { Controller, useFormContext } from 'react-hook-form'
import { Box, FormControl, FormErrorMessage } from '@chakra-ui/react'

import { PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID } from '~shared/constants'

import MoneyInput from '~components/MoneyInput'

import { usePaymentFieldValidation } from '../../../../../hooks/usePaymentFieldValidation'

import PaymentItemNameDescription from './PaymentItemNameDescription'
import { VariableItemDetailProps } from './types'

export const VariablePaymentItemDetailsBlock = ({
  paymentDescription,
  paymentItemName,
  paymentMin,
  paymentMax,
}: VariableItemDetailProps): JSX.Element => {
  const {
    control,
    formState: { errors },
  } = useFormContext()
  const amountValidation = usePaymentFieldValidation<
    {
      [PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID]: string
    },
    typeof PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID
  >({ lesserThanCents: paymentMax, greaterThanCents: paymentMin })

  return (
    <Box>
      <FormControl
        isInvalid={!!errors[PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID]}
        isRequired
      >
        <PaymentItemNameDescription
          paymentDescription={paymentDescription}
          paymentItemName={paymentItemName}
        />
        <Controller
          name={PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID}
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
          {errors[PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID]?.message}
        </FormErrorMessage>
      </FormControl>
    </Box>
  )
}
