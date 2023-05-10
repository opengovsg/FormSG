import { FormControl } from '@chakra-ui/react'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'

export const ProductServiceBox = ({
  register,
  paymentsMutation,
  errors,
  paymentIsEnabled,
}) => {
  return (
    <>
      <FormControl
        isReadOnly={paymentsMutation.isLoading}
        isInvalid={!!errors.description}
        isDisabled={!paymentIsEnabled}
        isRequired
      >
        <FormLabel description="This will be reflected on the payment invoice">
          Product/service name
        </FormLabel>
        <Input
          placeholder="Product/service name"
          {...register('description', {
            required: paymentIsEnabled && 'Please enter a payment description',
          })}
        />
        <FormErrorMessage>{errors.description?.message}</FormErrorMessage>
      </FormControl>
    </>
  )
}
