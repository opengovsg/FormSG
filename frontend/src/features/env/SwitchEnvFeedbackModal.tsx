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

import { switchEnvFeedbackFormBodyDto } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import { ModalCloseButton } from '~components/Modal'
import Textarea from '~components/Textarea'

import { useUser } from '~features/user/queries'

import { useEnvMutations } from './mutations'
import { useSwitchEnvFeedbackFormView } from './queries'

export interface SwitchEnvModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SwitchEnvFeedbackModal = ({
  isOpen,
  onClose,
}: SwitchEnvModalProps): JSX.Element => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const isMobile = useIsMobile()

  const { register, handleSubmit } = useForm<switchEnvFeedbackFormBodyDto>()
  const initialRef = useRef(null)

  const { user } = useUser()
  const url = window.location.href
  const [showThanksPage, setShowThanksPage] = useState<boolean>(false)

  // get the feedback form data
  const { data: feedbackForm } = useSwitchEnvFeedbackFormView()

  const {
    submitSwitchEnvFormFeedbackMutation,
    adminSwitchEnvMutation,
    publicSwitchEnvMutation,
  } = useEnvMutations(feedbackForm)

  const submitFeedback = useCallback(
    (formInputs: switchEnvFeedbackFormBodyDto) => {
      return submitSwitchEnvFormFeedbackMutation.mutateAsync(formInputs)
    },
    [submitSwitchEnvFormFeedbackMutation],
  )

  const handleFormSubmit = handleSubmit((inputs) => {
    submitFeedback(inputs)
    setShowThanksPage(true)
  })

  const handleClose = () => {
    onClose()
    setShowThanksPage(false)
  }

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
                <Button
                  isFullWidth={isMobile}
                  onClick={() => {
                    user
                      ? adminSwitchEnvMutation.mutate()
                      : publicSwitchEnvMutation.mutate()
                    onClose()
                    setShowThanksPage(false)
                  }}
                >
                  Yes, please
                </Button>
              </Stack>
            </ModalFooter>
          </>
        ) : (
          <chakra.form noValidate onSubmit={handleFormSubmit}>
            <ModalHeader>Something not right on the new FormSG?</ModalHeader>
            <ModalBody mt="0" pt="0">
              <Stack spacing="1rem">
                <FormControl>
                  <Input type="hidden" {...register('url')} value={url} />
                </FormControl>
                <FormControl>
                  <FormLabel
                    description={
                      user
                        ? ''
                        : 'Any fields you’ve filled in your form so far will be cleared'
                    }
                  >
                    Please tell us what we can improve on
                  </FormLabel>
                  <Textarea {...register('feedback')} tabIndex={1} />
                </FormControl>
                <FormControl>
                  {user ? (
                    <Input
                      type="hidden"
                      {...register('email')}
                      value={user.email}
                    />
                  ) : (
                    <></>
                  )}
                </FormControl>
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
                  mr="1rem"
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
