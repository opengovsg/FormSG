import { Controller, useFormContext } from 'react-hook-form'
import { Box, FormControl, FormErrorMessage, Text } from '@chakra-ui/react'

import { PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID } from '~shared/constants'

import MoneyInput from '~components/MoneyInput'

import { centsToDollarString } from '~features/admin-form/responses/common/utils/getPaymentDataView'

import { usePaymentFieldValidation } from '../../../../../hooks/usePaymentFieldValidation'

import PaymentItemNameDescription from './PaymentItemNameDescription'
import { VariableItemDetailProps } from './types'

export const VariablePaymentItemDetailsField = ({
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
      <Text textStyle="body-2" color="secondary.400" mt="0.5rem">
        The minimum amount is {centsToDollarString(paymentMin)} and the maximum
        amount is {centsToDollarString(paymentMax)}.
      </Text>
    </Box>
  )
}
