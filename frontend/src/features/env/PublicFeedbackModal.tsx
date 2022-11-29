// TODO #4279: Remove after React rollout is complete
import { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  chakra,
  FormControl,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  useBreakpointValue,
} from '@chakra-ui/react'
import { datadogRum } from '@datadog/browser-rum'
import validator from 'validator'

import { PublicFeedbackFormDto } from '~shared/types'

import { INVALID_EMAIL_ERROR } from '~constants/validation'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { ModalCloseButton } from '~components/Modal'
import Textarea from '~components/Textarea'

import {
  useEnvMutations,
  usePublicFeedbackMutation,
} from '~features/env/mutations'
import { useUser } from '~features/user/queries'

export const PublicFeedbackModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const isMobile = useIsMobile()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PublicFeedbackFormDto>()

  const initialRef = useRef(null)

  const { user } = useUser()
  const url = window.location.href
  const rumSessionId = datadogRum.getInternalContext()?.session_id
  const [showThanksPage, setShowThanksPage] = useState<boolean>(false)

  const { publicSwitchEnvMutation } = useEnvMutations()
  const publicFeedbackMutation = usePublicFeedbackMutation()

  const handleSubmitForm = handleSubmit((inputs: PublicFeedbackFormDto) => {
    publicFeedbackMutation.mutateAsync(inputs)
    setShowThanksPage(true)
  })

  const handleClose = useCallback(() => {
    onClose()
    setShowThanksPage(false)
  }, [onClose])

  const handleChangeEnv = useCallback(() => {
    publicSwitchEnvMutation.mutate()
  }, [publicSwitchEnvMutation])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size={modalSize}
      initialFocusRef={initialRef}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        {showThanksPage ? (
          <>
            <ModalHeader>Thank you for your feedback!</ModalHeader>
            <ModalBody>
              Would you like to switch back to the original FormSG?
            </ModalBody>
            <ModalFooter mt={{ base: '2.5rem', md: '0' }}>
              <Stack
                w="100%"
                spacing="1rem"
                justify="right"
                direction={{ base: 'column-reverse', md: 'row' }}
              >
                <Button
                  isFullWidth={isMobile}
                  variant="clear"
                  onClick={handleClose}
                >
                  No, don't switch
                </Button>
                <Button isFullWidth={isMobile} onClick={handleChangeEnv}>
                  Yes, please
                </Button>
              </Stack>
            </ModalFooter>
          </>
        ) : (
          <chakra.form noValidate onSubmit={handleSubmitForm}>
            <ModalHeader pr="48px">Can't submit this form?</ModalHeader>
            <ModalBody mt="0" pt="0">
              <Stack spacing="1rem">
                <FormControl>
                  <Input type="hidden" {...register('url')} value={url} />
                </FormControl>

                <FormControl isRequired isInvalid={!!errors['feedback']}>
                  <FormLabel description="Any fields you've filled in your form so far will be cleared">
                    Please tell us about the issue(s) you're facing. It'll help
                    us improve FormSG.
                  </FormLabel>
                  <Textarea
                    {...register('feedback', {
                      required: {
                        value: true,
                        message: 'This field is required',
                      },
                    })}
                  />
                  <FormErrorMessage>
                    {errors['feedback']?.message}
                  </FormErrorMessage>
                </FormControl>

                {user ? (
                  <FormControl>
                    <Input
                      type="hidden"
                      {...register('email')}
                      value={user.email}
                    />
                  </FormControl>
                ) : (
                  <FormControl isInvalid={!!errors['email']}>
                    <FormLabel>
                      Email, if we need to contact you for details
                    </FormLabel>
                    <Input
                      {...register('email', {
                        validate: (value) => {
                          if (!value) {
                            return true
                          }
                          // Valid email check
                          if (!validator.isEmail(value)) {
                            return INVALID_EMAIL_ERROR
                          }
                        },
                      })}
                    />
                    <FormErrorMessage>
                      {errors['email']?.message}
                    </FormErrorMessage>
                  </FormControl>
                )}

                {rumSessionId ? (
                  <FormControl>
                    <Input
                      type="hidden"
                      {...register('rumSessionId')}
                      value={`https://app.datadoghq.com/rum/replay/sessions/${rumSessionId}`}
                    />
                  </FormControl>
                ) : null}
              </Stack>
            </ModalBody>
            <ModalFooter mt={{ base: '2.5rem', md: '0' }}>
              <Stack
                w="100%"
                spacing="1rem"
                justify="right"
                direction={{ base: 'column-reverse', md: 'row' }}
              >
                <Button
                  isFullWidth={isMobile}
                  variant="clear"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button isFullWidth={isMobile} type="submit">
                  Next
                </Button>
              </Stack>
            </ModalFooter>
          </chakra.form>
        )}
      </ModalContent>
    </Modal>
  )
}
