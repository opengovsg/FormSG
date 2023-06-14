import { Controller, useFormContext } from 'react-hook-form'
import { Box } from '@chakra-ui/react'

import MoneyInput from '~components/MoneyInput'

import { usePaymentFieldValidation } from '../queries'

import { PaymentItemDetailsBlockProps } from './PaymentItemDetailsBlock'
import PaymentItemNameDescription from './PaymentItemNameDescription'

export const VariablePaymentItemDetailsField = ({
  paymentDescription,
  paymentItemName,
  colorTheme,
}: PaymentItemDetailsBlockProps): JSX.Element => {
  const { control } = useFormContext()
  const amountValidation = usePaymentFieldValidation<
    { display_amount: string },
    'display_amount'
  >()

  return (
    <Box
      borderWidth="1px"
      borderColor={`theme-${colorTheme}.300`}
      borderRadius="4px"
      p="0.7rem"
    >
      <PaymentItemNameDescription
        paymentDescription={paymentDescription}
        paymentItemName={paymentItemName}
      />
      <Box>
        <Controller
          name="display_amount"
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
      </Box>
    </Box>
  )
}
