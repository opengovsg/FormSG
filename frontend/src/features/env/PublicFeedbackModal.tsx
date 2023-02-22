// TODO #4279: Remove after React rollout is complete
import { useCallback, useMemo, useRef, useState } from 'react'
import { get, useForm } from 'react-hook-form'
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
  Skeleton,
  Stack,
  useBreakpointValue,
} from '@chakra-ui/react'
import { datadogRum } from '@datadog/browser-rum'
import validator from 'validator'

import {
  FormAuthType,
  FormResponseMode,
  PublicFeedbackFormDto,
} from '~shared/types'

import { INVALID_EMAIL_ERROR, REQUIRED_ERROR } from '~constants/validation'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { ModalCloseButton } from '~components/Modal'
import Textarea from '~components/Textarea'

import { useEnvMutations, useFeedbackMutation } from '~features/env/mutations'

import { usePublicFeedbackFormView } from './queries'
import { isUsableFeedback } from './utils'

export const othersInputName = 'othersInput'
export const PublicFeedbackModal = ({
  isOpen,
  onClose,
  responseMode,
  authType,
}: {
  isOpen: boolean
  onClose: () => void
  responseMode?: FormResponseMode
  authType?: FormAuthType
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
    getValues,
  } = useForm<PublicFeedbackFormDto>()

  const initialRef = useRef(null)

  const url = window.location.href
  const rumSessionId = datadogRum.getInternalContext()?.session_id
  const [showThanksPage, setShowThanksPage] = useState<boolean>(false)

  const { publicSwitchEnvMutation } = useEnvMutations()
  const { data: feedbackForm, isLoading } = usePublicFeedbackFormView()
  const feedbackMutation = useFeedbackMutation()

  const handleSubmitForm = handleSubmit((formInputs: PublicFeedbackFormDto) => {
    if (!feedbackForm) return
    if (isUsableFeedback(formInputs.feedback)) {
      feedbackMutation.mutate({ formInputs, feedbackForm })
    }
    setShowThanksPage(true)
  })

  const handleClose = useCallback(() => {
    onClose()
    setShowThanksPage(false)
  }, [onClose])

  const handleChangeEnv = useCallback(() => {
    publicSwitchEnvMutation.mutate()
  }, [publicSwitchEnvMutation])

  const checkboxInputName = 'attachmentType'

  const CHECKBOX_OTHERS_INPUT_VALUE =
    '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'
  const ATTACHMENT_TYPE_OPTIONS = ['PDF', 'JPEG', 'PNG', 'ZIP']

  const othersValidationRules = useMemo(
    () => ({
      validate: (value?: string) => {
        const currCheckedVals = getValues(checkboxInputName)
        return (
          !(
            Array.isArray(currCheckedVals) &&
            currCheckedVals.includes(CHECKBOX_OTHERS_INPUT_VALUE)
          ) ||
          !!value?.trim() ||
          'Please specify a value for the "others" option'
        )
      },
    }),
    [checkboxInputName, getValues],
  )
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
            <ModalHeader pr="3rem">Can't submit this form?</ModalHeader>
            <ModalBody mt="0" pt="0">
              <Skeleton isLoaded={!isLoading}>
                <Stack spacing="1rem">
                  <Input type="hidden" {...register('url')} value={url} />

                  <FormControl isRequired isInvalid={!!errors['feedback']}>
                    <FormLabel description="Any fields you've filled in your form so far will be cleared">
                      Please tell us about the issue(s) you're facing. It'll
                      help us improve FormSG.
                    </FormLabel>
                    <Textarea
                      {...register('feedback', {
                        required: {
                          value: true,
                          message: REQUIRED_ERROR,
                        },
                      })}
                    />
                    <FormErrorMessage>
                      {errors['feedback']?.message}
                    </FormErrorMessage>
                  </FormControl>
                  <FormControl>
                    <FormLabel>
                      File type(s) of attachment(s) uploaded, if any
                    </FormLabel>
                    {ATTACHMENT_TYPE_OPTIONS.map((option) => (
                      <Checkbox
                        key={option}
                        value={option}
                        defaultValue=""
                        {...register(checkboxInputName)}
                      >
                        {option}
                      </Checkbox>
                    ))}
                    <Checkbox.OthersWrapper>
                      <FormControl isInvalid={!!get(errors, othersInputName)}>
                        <Checkbox.OthersCheckbox
                          value={CHECKBOX_OTHERS_INPUT_VALUE}
                          isInvalid={!!get(errors, checkboxInputName)}
                          {...register(checkboxInputName)}
                        />
                        <Checkbox.OthersInput
                          {...register(othersInputName, othersValidationRules)}
                        />
                        <FormErrorMessage>
                          {get(errors, `${othersInputName}.message`)}
                        </FormErrorMessage>
                      </FormControl>
                    </Checkbox.OthersWrapper>
                  </FormControl>
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

                  {rumSessionId ? (
                    <Input
                      type="hidden"
                      {...register('rumSessionId')}
                      value={`https://app.datadoghq.com/rum/replay/sessions/${rumSessionId}`}
                    />
                  ) : null}
                  <Input
                    type="hidden"
                    {...register('userAgent')}
                    value={`${window.navigator.userAgent}`}
                  />
                  <Input
                    type="hidden"
                    {...register('responseMode')}
                    value={responseMode}
                  />
                  <Input
                    type="hidden"
                    {...register('authType')}
                    value={authType}
                  />
                </Stack>
              </Skeleton>
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
                  isDisabled={feedbackMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  isFullWidth={isMobile}
                  type="submit"
                  isDisabled={isLoading}
                  isLoading={feedbackMutation.isLoading}
                >
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
