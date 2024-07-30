import { Controller, useForm } from 'react-hook-form'
import { BiMinus, BiPlus } from 'react-icons/bi'
import {
  FormControl,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import IconButton from '~components/IconButton'
import { ModalCloseButton } from '~components/Modal'

interface PaymentQuantityModalProps
  extends Pick<UseDisclosureReturn, 'onClose' | 'isOpen'> {
  onCancel: () => void
  onSubmit: (quantity: number) => void
  itemName: string
  initialQty: number
  minQty: number
  maxQty: number
}

const PaymentQuantityModal = ({
  isOpen,
  onClose,
  onSubmit,
  itemName,
  initialQty,
  minQty,
  maxQty,
}: PaymentQuantityModalProps) => {
  const {
    formState: { errors },
    control,
    setValue,
    watch,
    trigger,
    resetField,
  } = useForm<{ quantity: number | '' }>({
    defaultValues: { quantity: initialQty },
    mode: 'onChange',
  })

  const quantity = watch('quantity')
  const positiveIntegerValidationRule = {
    validate: (val: number | '') => {
      if (!val) {
        return `Minimum quantity is ${minQty}`
      }
      if (!Number.isInteger(val)) {
        return 'Please enter a whole number'
      }
      if (val < minQty) {
        return `Minimum quantity is ${minQty}`
      }
      if (val > maxQty) {
        return `Maximum quantity is ${maxQty}`
      }
      return true
    },
  }

  const isMobile = useIsMobile()
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onCloseComplete={() => {
        resetField('quantity', { defaultValue: initialQty })
      }}
      size="selector"
      variant={isMobile ? 'bottom' : 'default'}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          <Text textStyle={isMobile ? 'h3' : 'h2'} mb="1rem">
            Update quantity
          </Text>
          <Text textStyle="body-2" color="content.medium">
            {itemName}
          </Text>
        </ModalHeader>
        <ModalBody>
          <FormControl isInvalid={Boolean(errors.quantity)}>
            <HStack spacing={'1.5rem'} justify="center">
              <IconButton
                icon={<BiMinus />}
                variant="clear"
                aria-label="Decrement"
                colorScheme="secondary"
                isDisabled={(quantity || 0) <= minQty}
                onClick={() => {
                  setValue('quantity', quantity ? quantity - 1 : minQty)
                  trigger('quantity')
                }}
              />
              <Controller
                name="quantity"
                control={control}
                rules={positiveIntegerValidationRule}
                render={({ field }) => (
                  <Input
                    {...field}
                    width="5rem"
                    onChange={(e) => {
                      if (e.target.value === '') {
                        field.onChange('')
                        return
                      }
                      field.onChange(Number(e.target.value))
                    }}
                    inputMode="numeric"
                    type="number"
                    textAlign="center"
                  />
                )}
              />
              <IconButton
                icon={<BiPlus />}
                variant="clear"
                aria-label="Increment"
                colorScheme="secondary"
                isDisabled={(quantity || 0) >= maxQty}
                onClick={() => {
                  setValue('quantity', quantity ? quantity + 1 : minQty)
                  trigger('quantity')
                }}
              />
            </HStack>
            <FormErrorMessage marginTop="1rem" marginBottom="0">
              {errors.quantity?.message}
            </FormErrorMessage>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Stack
            flex={1}
            spacing="1rem"
            direction={{ base: 'row', md: 'row-reverse' }}
          >
            <Button
              isDisabled={Boolean(errors.quantity)}
              loadingText="Saving"
              onClick={() => onSubmit(quantity || 1)}
              isFullWidth={isMobile}
            >
              Update
            </Button>
            {!isMobile ? (
              <Button variant="clear" onClick={onClose} colorScheme="secondary">
                Cancel
              </Button>
            ) : null}
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
export default PaymentQuantityModal
