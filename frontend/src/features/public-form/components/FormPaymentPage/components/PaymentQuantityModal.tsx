import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.publicForm.components.payment.quantityModal',
  })
  const { t: tCommon } = useTranslation()
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
        return t('errors.minQuantity', { minQty })
      }
      if (!Number.isInteger(val)) {
        return t('errors.wholeNumber')
      }
      if (val < minQty) {
        return t('errors.minQuantity', { minQty })
      }
      if (val > maxQty) {
        return t('errors.maxQuantity', { maxQty })
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
            {t('header')}
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
                aria-label={t('buttons.decrement')}
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
                aria-label={t('buttons.increment')}
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
              loadingText={t('buttons.saving')}
              onClick={() => onSubmit(quantity || 1)}
              isFullWidth={isMobile}
            >
              {t('buttons.update')}
            </Button>
            {!isMobile ? (
              <Button variant="clear" onClick={onClose} colorScheme="secondary">
                {tCommon('features.common.cancel')}
              </Button>
            ) : null}
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
export default PaymentQuantityModal
