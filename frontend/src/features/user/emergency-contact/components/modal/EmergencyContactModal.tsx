import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { BiCheck } from 'react-icons/bi'
import {
  Flex,
  FormControl,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { isMobilePhoneNumber } from '~shared/utils/phone-num-validation'

import { REQUIRED_ERROR } from '~constants/validation'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import PhoneNumberInput from '~components/PhoneNumberInput'

import { useUserMutations } from '~features/user/mutations'
import { useUser } from '~features/user/queries'

import { VerificationBox } from './VerificationBox'

type ContactNumberFormInputs = {
  contact: string
}

const ContactNumberInput = () => {
  const { user, isLoading } = useUser()
  const [isVfnOpen, setIsVfnOpen] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    control,
    watch,
    handleSubmit,
    formState: { isValid, isSubmitting, errors },
  } = useForm<ContactNumberFormInputs>({
    defaultValues: {
      contact: user?.contact,
    },
  })

  const contact = watch('contact')

  const isVerified = useMemo(
    () => !!user?.contact && contact === user.contact,
    [contact, user?.contact],
  )

  const { generateOtpMutation } = useUserMutations()

  const handleSendOtp = (inputs: ContactNumberFormInputs) => {
    if (!user || isVerified) return
    return generateOtpMutation.mutate(
      { userId: user._id, contact: inputs.contact },
      { onSuccess: () => setIsVfnOpen(true) },
    )
  }

  const handleInputChange = (nextVal?: string) => {
    if (isVfnOpen && nextVal !== contact) {
      setIsVfnOpen(false)
    }
  }

  const contactNumberValidationRules = useMemo(() => {
    return {
      required: REQUIRED_ERROR,
      validate: {
        validPhoneNumber: (val?: string) => {
          return (
            !val ||
            isMobilePhoneNumber(val) ||
            'Please enter a valid mobile number'
          )
        },
      },
    }
  }, [])

  return (
    <FormControl
      mt="1rem"
      isRequired
      isReadOnly={(isValid && isSubmitting) || isLoading}
      isInvalid={!!errors.contact}
    >
      <FormLabel>Mobile number</FormLabel>
      <Flex>
        <Controller
          name="contact"
          control={control}
          rules={contactNumberValidationRules}
          render={({ field: { onChange, ...rest } }) => (
            <PhoneNumberInput
              isSuccess={isSuccess}
              {...rest}
              onChange={(nextVal) => {
                handleInputChange(nextVal)
                onChange(nextVal)
              }}
            />
          )}
        />
        <Button
          isDisabled={isVerified || isVfnOpen}
          ml="0.5rem"
          onClick={handleSubmit(handleSendOtp)}
          isLoading={generateOtpMutation.isLoading}
          leftIcon={isVerified ? <BiCheck fontSize="1.5rem" /> : undefined}
        >
          {isVerified ? 'Verified' : 'Verify'}
        </Button>
      </Flex>
      <FormErrorMessage>
        {errors.contact && errors.contact.message}
      </FormErrorMessage>
      {isVfnOpen && !isVerified ? (
        <VerificationBox onSuccess={() => setIsSuccess(true)} />
      ) : null}
    </FormControl>
  )
}

export const EmergencyContactModal = (): JSX.Element => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  return (
    <>
      <Button onClick={onOpen}>Open</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader color="secondary.700">Emergency contact</ModalHeader>
          <ModalBody whiteSpace="pre-line" pb="3.25rem">
            <Text textStyle="body-2" color="secondary.500">
              Update your mobile number and verify it so we can contact you in
              the unlikely case of an urgent form issue. This number can be
              changed at any time in your user settings.
            </Text>
            <ContactNumberInput />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
