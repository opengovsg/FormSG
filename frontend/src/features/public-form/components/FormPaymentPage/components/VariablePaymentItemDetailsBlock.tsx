import { Controller, useFormContext } from 'react-hook-form'
import { Box, FormControl, Text } from '@chakra-ui/react'

import { PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID } from '~shared/constants'
import { centsToDollars, formatCurrency } from '~shared/utils/payments'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import MoneyInput from '~components/MoneyInput'

import { centsToDollarString } from '~features/admin-form/responses/common/utils/getPaymentDataView'
import { useEnv } from '~features/env/queries'

import { usePaymentFieldValidation } from '../../../../../hooks/usePaymentFieldValidation'

import PaymentItemNameDescription from './PaymentItemNameDescription'
import { VariableItemDetailProps } from './types'

export const VariablePaymentItemDetailsBlock = ({
  paymentDescription,
  paymentItemName,
  paymentMin,
  paymentMax: _paymentMax,
}: VariableItemDetailProps): JSX.Element => {
  const {
    control,
    formState: { errors },
  } = useFormContext()

  const { data: { maxPaymentAmountCents = Number.MAX_SAFE_INTEGER } = {} } =
    useEnv()
  const paymentMax = _paymentMax || maxPaymentAmountCents
  const amountValidation = usePaymentFieldValidation<
    {
      [PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID]: string
    },
    typeof PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID
  >({ lesserThanCents: paymentMax, greaterThanCents: paymentMin })

  const amountHint = `Enter an amount between ${centsToDollarString(
    paymentMin,
  )} and S${formatCurrency(Number(centsToDollars(paymentMax)))}.`

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

        {errors[PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID]?.message ? (
          <FormErrorMessage>{amountHint}</FormErrorMessage>
        ) : (
          <Text textStyle="body-2" color="secondary.400" mt="0.5rem">
            {amountHint}
          </Text>
        )}
      </FormControl>
    </Box>
  )
}
