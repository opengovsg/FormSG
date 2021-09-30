import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { BiCheck } from 'react-icons/bi'
import { Flex, FormControl } from '@chakra-ui/react'

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

export const ContactNumberInput = (): JSX.Element => {
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
    <form>
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
            type="submit"
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
          <VerificationBox
            onSuccess={() => setIsSuccess(true)}
            contact={contact}
          />
        ) : null}
      </FormControl>
    </form>
  )
}
