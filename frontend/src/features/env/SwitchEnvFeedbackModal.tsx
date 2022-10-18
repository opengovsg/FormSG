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

import { SwitchEnvFeedbackFormBodyDto } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import { ModalCloseButton } from '~components/Modal'
import Textarea from '~components/Textarea'

import { useUser } from '~features/user/queries'

export interface SwitchEnvModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmitFeedback: (formInputs: SwitchEnvFeedbackFormBodyDto) => Promise<any>
  onChangeEnv: () => void
}

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

  const { register, handleSubmit } = useForm<SwitchEnvFeedbackFormBodyDto>()
  const initialRef = useRef(null)

  const { user } = useUser()
  const url = window.location.href
  const rumSessionId = datadogRum.getInternalContext()?.session_id
  const [showThanksPage, setShowThanksPage] = useState<boolean>(false)

  const handleFormSubmit = handleSubmit((inputs) => {
    onSubmitFeedback(inputs)
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
                {user ? (
                  <FormControl>
                    <Input
                      type="hidden"
                      {...register('email')}
                      value={user.email}
                    />
                  </FormControl>
                ) : null}
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
