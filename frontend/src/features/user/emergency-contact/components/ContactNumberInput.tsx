import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { BiCheck } from 'react-icons/bi'
import { Box, FormControl, Skeleton, Stack } from '@chakra-ui/react'

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

export const INVALID_NUMBER_ERROR_MSG = 'Please enter a valid mobile number'

const useContactNumberInput = () => {
  const { user } = useUser()
  const [isSuccess, setIsSuccess] = useState(false)
  const [isVfnBoxOpen, setIsVfnBoxOpen] = useState(false)
  const [contactToVerify, setContactToVerify] = useState<string | undefined>()

  const {
    control,
    watch,
    handleSubmit,
    reset,
    formState: { isValid, isSubmitting, errors },
  } = useForm<ContactNumberFormInputs>()

  useEffect(() => {
    if (user) {
      reset({
        contact: user.contact,
      })
    }
  }, [reset, user])

  const contact = watch('contact')

  const isVerified = useMemo(
    () => !!user?.contact && contact === user.contact,
    [contact, user?.contact],
  )

  const { generateOtpMutation } = useUserMutations()

  const handleInputChange = useCallback(
    (nextVal?: string) => {
      setIsVfnBoxOpen(!!contactToVerify && nextVal === contactToVerify)
      if (isSuccess) {
        setIsSuccess(false)
      }
    },
    [contactToVerify, isSuccess],
  )

  const handleVfnSuccess = useCallback(() => {
    setIsSuccess(true)
    // Clear contact
    setContactToVerify(undefined)
  }, [])

  const handleSubmitContact = handleSubmit(
    useCallback(
      (inputs: ContactNumberFormInputs) => {
        if (!user || isVerified) return
        return generateOtpMutation.mutate(
          { userId: user._id, contact: inputs.contact },
          {
            onSuccess: () => {
              setContactToVerify(inputs.contact)
              setIsVfnBoxOpen(true)
            },
          },
        )
      },
      [generateOtpMutation, isVerified, user],
    ),
  )

  const contactNumberValidationRules = useMemo(() => {
    return {
      required: REQUIRED_ERROR,
      validate: {
        validPhoneNumber: (val?: string) => {
          return !val || isMobilePhoneNumber(val) || INVALID_NUMBER_ERROR_MSG
        },
      },
    }
  }, [])

  const isInputReadOnly = useMemo(
    () => (isValid && isSubmitting) || !user,
    [isSubmitting, isValid, user],
  )
  const isVerifyButtonDisabled = useMemo(
    () => isVerified || isVfnBoxOpen,
    [isVerified, isVfnBoxOpen],
  )

  const isVerifyButtonLoading = useMemo(
    () => generateOtpMutation.isLoading,
    [generateOtpMutation.isLoading],
  )

  return {
    handleInputChange,
    handleVfnSuccess,
    handleSubmitContact,
    contactNumberValidationRules,
    contactToVerify,
    isVfnBoxOpen,
    isSuccess,
    isVerified,
    isInputReadOnly,
    isVerifyButtonDisabled,
    isVerifyButtonLoading,
    contactInputError: errors.contact,
    contactInputControl: control,
    userId: user?._id,
  }
}

export const ContactNumberInput = (): JSX.Element => {
  const {
    handleInputChange,
    handleSubmitContact,
    handleVfnSuccess,
    isSuccess,
    isInputReadOnly,
    isVerifyButtonDisabled,
    isVerifyButtonLoading,
    isVerified,
    isVfnBoxOpen,
    contactNumberValidationRules,
    contactToVerify,
    contactInputError,
    contactInputControl,
    userId,
  } = useContactNumberInput()

  return (
    <>
      <form>
        <FormControl
          mt="1rem"
          isRequired
          isReadOnly={isInputReadOnly}
          isInvalid={!!contactInputError}
        >
          <FormLabel>Mobile number</FormLabel>
          <Skeleton isLoaded={!!userId}>
            <Stack direction={{ base: 'column', md: 'row' }} spacing="0.5rem">
              <Controller
                name="contact"
                control={contactInputControl}
                rules={contactNumberValidationRules}
                render={({ field: { onChange, ...rest } }) => (
                  <PhoneNumberInput
                    isSuccess={isSuccess}
                    {...rest}
                    // Placeholder will not be seen by users due to the skeleton.
                    // Used for asserting asynchronicity has ended in tests.
                    placeholder={!userId ? 'Loading user...' : undefined}
                    onChange={(nextVal) => {
                      handleInputChange(nextVal)
                      onChange(nextVal)
                    }}
                  />
                )}
              />
              <Box>
                <Button
                  type="submit"
                  isDisabled={isVerifyButtonDisabled}
                  onClick={handleSubmitContact}
                  isLoading={isVerifyButtonLoading}
                  leftIcon={
                    isVerified ? <BiCheck fontSize="1.5rem" /> : undefined
                  }
                >
                  {isVerified ? 'Verified' : 'Verify'}
                </Button>
              </Box>
            </Stack>
            <FormErrorMessage>{contactInputError?.message}</FormErrorMessage>
          </Skeleton>
        </FormControl>
      </form>
      {isVfnBoxOpen && userId && contactToVerify ? (
        <VerificationBox
          userId={userId}
          onSuccess={handleVfnSuccess}
          contact={contactToVerify}
        />
      ) : null}
    </>
  )
}
