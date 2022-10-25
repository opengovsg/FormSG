// TODO #4279: Remove after React rollout is complete
import { useCallback, useRef, useState } from 'react'
import { FieldError, useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
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
import { get, isEmpty } from 'lodash'
import validator from 'validator'

import { SwitchEnvFeedbackFormBodyDto } from '~shared/types'

import { INVALID_EMAIL_ERROR } from '~constants/validation'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { ModalCloseButton } from '~components/Modal'
import Radio, { OthersInput } from '~components/Radio'
import Textarea from '~components/Textarea'

import { useUser } from '~features/user/queries'

export interface SwitchEnvModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmitFeedback: (formInputs: SwitchEnvFeedbackFormBodyDto) => Promise<any>
  onChangeEnv: () => void
}

export const ADMIN_RADIO_OPTIONS = [
  'I couldn’t find a feature I needed',
  'The new FormSG did not function properly',
]
export const PUBLIC_RADIO_OPTIONS = ['I couldn’t submit my form']
export const COMMON_RADIO_OPTIONS = ['I’m not used to the new FormSG']
export const FEEDBACK_OTHERS_INPUT_NAME = 'others-input'

export const SwitchEnvFeedbackModal = ({
  isOpen,
  onClose,
  onChangeEnv,
  onSubmitFeedback,
}: SwitchEnvModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const isMobile = useIsMobile()

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SwitchEnvFeedbackFormBodyDto>()

  const othersInputError: FieldError | undefined = get(
    errors,
    FEEDBACK_OTHERS_INPUT_NAME,
  )
  const othersInputValue = '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

  const initialRef = useRef(null)

  const { user } = useUser()
  const url = window.location.href
  const { formId } = useParams()
  const rumSessionId = datadogRum.getInternalContext()?.session_id
  const [showThanksPage, setShowThanksPage] = useState<boolean>(false)
  const publicFormPath = new RegExp(`^/${formId}`)

  const handleFormSubmit = handleSubmit((inputs) => {
    // Prevent submission if radio option 'I’m not used to the new FormSG' is selected
    if (!COMMON_RADIO_OPTIONS.includes(inputs.radio)) onSubmitFeedback(inputs)
    setShowThanksPage(true)
  })

  const handleClose = () => {
    onClose()
    setShowThanksPage(false)
  }

  const handleChangeEnv = useCallback(() => {
    onChangeEnv()
    onClose()
    setShowThanksPage(false)
  }, [onChangeEnv, onClose])

  const isPublicFormPage = window.location.pathname.match(publicFormPath)

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
              Something not right on the new FormSG?
            </ModalHeader>
            <ModalBody mt="0" pt="0">
              <Stack spacing="1rem">
                <FormControl>
                  <Input type="hidden" {...register('url')} value={url} />
                </FormControl>
                <FormControl isRequired={true} isInvalid={!isEmpty(errors)}>
                  <FormLabel>
                    Why are you switching to the previous FormSG?
                  </FormLabel>
                  <Radio.RadioGroup>
                    {isPublicFormPage
                      ? PUBLIC_RADIO_OPTIONS.map((option) => (
                          <Radio
                            {...register('radio', {
                              required: {
                                value: true,
                                message: 'This field is required',
                              },
                              deps: [FEEDBACK_OTHERS_INPUT_NAME],
                            })}
                            value={option}
                            key={option}
                          >
                            {option}
                          </Radio>
                        ))
                      : ADMIN_RADIO_OPTIONS.map((option) => (
                          <Radio
                            {...register('radio', {
                              required: {
                                value: true,
                                message: 'This field is required',
                              },
                              deps: [FEEDBACK_OTHERS_INPUT_NAME],
                            })}
                            value={option}
                            key={option}
                          >
                            {option}
                          </Radio>
                        ))}
                    {COMMON_RADIO_OPTIONS.map((option) => (
                      <Radio
                        {...register('radio', {
                          required: {
                            value: true,
                            message: 'This field is required',
                          },
                          deps: [FEEDBACK_OTHERS_INPUT_NAME],
                        })}
                        value={'I’m not used to the new FormSG'}
                        key={option}
                      >
                        {option}
                      </Radio>
                    ))}
                    <Radio.OthersWrapper
                      {...register('radio', {
                        required: {
                          value: true,
                          message: 'This field is required',
                        },
                        deps: [FEEDBACK_OTHERS_INPUT_NAME],
                      })}
                      value={othersInputValue}
                    >
                      <FormControl
                        isRequired={true}
                        isInvalid={!!othersInputError}
                      >
                        <OthersInput
                          aria-label='"Other" response'
                          {...register(FEEDBACK_OTHERS_INPUT_NAME, {
                            validate: (value) => {
                              return (
                                getValues('radio') !== othersInputValue ||
                                !!value ||
                                'Please specify a value for the "Others" option'
                              )
                            },
                          })}
                        />
                      </FormControl>
                    </Radio.OthersWrapper>
                  </Radio.RadioGroup>
                  {errors['email'] ? null : (
                    <FormErrorMessage>
                      {errors['radio']?.message ??
                        errors[FEEDBACK_OTHERS_INPUT_NAME]?.message ??
                        null}
                    </FormErrorMessage>
                  )}
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
                      tabIndex={1}
                    />
                    <FormErrorMessage>
                      {errors['email']?.message}
                    </FormErrorMessage>
                  </FormControl>
                )}
                <FormControl>
                  <FormLabel
                    description={
                      user
                        ? ''
                        : 'Any fields you’ve filled in your form so far will be cleared'
                    }
                  >
                    Describe your problem in detail to help us improve FormSG
                  </FormLabel>
                  <Textarea {...register('feedback')} tabIndex={1} />
                </FormControl>
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
