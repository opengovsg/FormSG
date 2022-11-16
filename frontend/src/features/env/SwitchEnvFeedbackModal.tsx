// TODO #4279: Remove after React rollout is complete
import { useCallback, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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
import { isEmpty } from 'lodash'
import validator from 'validator'

import { SwitchEnvFeedbackFormBodyDto } from '~shared/types'

import { INVALID_EMAIL_ERROR } from '~constants/validation'
import { useIsMobile } from '~hooks/useIsMobile'
import { useToast } from '~hooks/useToast'
import Button from '~components/Button'
import Rating from '~components/Field/Rating'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { ModalCloseButton } from '~components/Modal'
import Textarea from '~components/Textarea'

import { useUser } from '~features/user/queries'

export interface SwitchEnvModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmitFeedback: (formInputs: SwitchEnvFeedbackFormBodyDto) => Promise<any>
  onChangeEnv?: () => void
  isAdminView: boolean
}

export const ADMIN_RADIO_OPTIONS = [
  'I couldn’t find a feature I needed',
  'The new FormSG did not function properly',
]
export const COMMON_RADIO_OPTIONS = ['I’m not used to the new FormSG']
export const FEEDBACK_OTHERS_INPUT_NAME = 'react-feedback-others-input'

export const SwitchEnvFeedbackModal = ({
  isOpen,
  onClose,
  onChangeEnv,
  onSubmitFeedback,
  isAdminView,
}: SwitchEnvModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const isMobile = useIsMobile()
  const toast = useToast({ status: 'success', isClosable: true })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SwitchEnvFeedbackFormBodyDto>()

  const initialRef = useRef(null)

  const { user } = useUser()
  const url = window.location.href
  const rumSessionId = datadogRum.getInternalContext()?.session_id
  const [showThanksPage, setShowThanksPage] = useState<boolean>(false)

  const handleFormSubmit = handleSubmit((inputs) => {
    // Prevent feedback form subbmission if radio option 'I’m not used to the new FormSG' is selected AND feedback is empty
    if (
      !(
        COMMON_RADIO_OPTIONS.includes(inputs.switchReason) &&
        !inputs.feedback.trim()
      )
    ) {
      onSubmitFeedback(inputs)
    }
    // Only allow public users to switch back. For admins, just close the modal.
    if (isAdminView) {
      toast({ description: 'Your feedback has been submitted.' })
      onClose()
    } else {
      setShowThanksPage(true)
    }
  })

  const handleClose = () => {
    onClose()
    setShowThanksPage(false)
  }

  const handleChangeEnv = useCallback(() => {
    if (onChangeEnv) onChangeEnv()
    onClose()
    setShowThanksPage(false)
  }, [onChangeEnv, onClose])

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
                  onClick={() => {
                    onClose()
                    setShowThanksPage(false)
                  }}
                >
                  No, don’t switch
                </Button>
                <Button isFullWidth={isMobile} onClick={handleChangeEnv}>
                  Yes, please
                </Button>
              </Stack>
            </ModalFooter>
          </>
        ) : (
          <chakra.form noValidate onSubmit={handleFormSubmit}>
            <ModalHeader pr="48px">
              {user
                ? 'Something not right on the new FormSG?'
                : "Can't submit this form?"}
            </ModalHeader>
            <ModalBody mt="0" pt="0">
              <Stack spacing="1rem">
                <FormControl>
                  <Input type="hidden" {...register('url')} value={url} />
                </FormControl>
                {user && isAdminView ? (
                  <FormControl isRequired isInvalid={!isEmpty(errors)}>
                    <FormLabel>How was your experience using FormSG?</FormLabel>
                    <Controller
                      rules={{ required: 'This field is required' }}
                      control={control}
                      name={'rating'}
                      render={({ field: { value, onChange, ...rest } }) => (
                        <Rating
                          numberOfRatings={5}
                          variant={'star'}
                          helperText={'1: Poor, 5: Excellent'}
                          value={Number(value)}
                          onChange={(val) => onChange(val?.toString())}
                          {...rest}
                        />
                      )}
                    />
                    <FormErrorMessage>
                      {errors['rating']?.message}
                    </FormErrorMessage>
                  </FormControl>
                ) : null}
                <FormControl
                  isRequired={!isAdminView}
                  isInvalid={!isAdminView && !isEmpty(errors)}
                >
                  <FormLabel
                    description={
                      isAdminView
                        ? ''
                        : 'Any fields you’ve filled in your form so far will be cleared'
                    }
                  >
                    {isAdminView
                      ? 'Do you have any other feedback for us?'
                      : 'Please tell us about the issue(s) you’re facing. It’ll help us improve FormSG.'}
                  </FormLabel>
                  <Textarea
                    {...register('feedback', {
                      required: {
                        value: !isAdminView,
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
                  {isAdminView ? 'Submit feedback' : 'Next'}
                </Button>
              </Stack>
            </ModalFooter>
          </chakra.form>
        )}
      </ModalContent>
    </Modal>
  )
}
