import { Controller, useForm } from 'react-hook-form'
import { BiMinus, BiPlus } from 'react-icons/bi'
import {
  Button,
  ButtonGroup,
  FormControl,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
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
      onClose={() => {
        onClose()
        resetField('quantity')
      }}
      size={isMobile ? 'selector-bottom' : 'selector'}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>
          <Text textStyle="h2" mb="1rem">
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
                isDisabled={quantity <= minQty}
                onClick={() =>
                  setValue('quantity', quantity ? quantity - 1 : minQty)
                }
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
                isDisabled={quantity >= maxQty}
                onClick={() => {
                  setValue('quantity', quantity ? quantity + 1 : minQty)
                  trigger('quantity')
                }}
              />
            </HStack>
            <FormErrorMessage>{errors.quantity?.message}</FormErrorMessage>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
            <Button variant="clear" onClick={onClose} colorScheme="secondary">
              Cancel
            </Button>
            <Button
              isDisabled={Boolean(errors.quantity)}
              loadingText="Saving"
              onClick={() => onSubmit(quantity || 1)}
            >
              Update
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
export default PaymentQuantityModal
