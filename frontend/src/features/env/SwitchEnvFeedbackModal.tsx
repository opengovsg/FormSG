import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import {
  chakra,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
} from '@chakra-ui/react'

import { switchEnvFeedbackFormBodyDto } from '~shared/types'

import Button from '~components/Button'
import { ModalCloseButton } from '~components/Modal'
import Textarea from '~components/Textarea'

import { useUser } from '~features/user/queries'

import { useEnvMutations } from './mutations'

export interface SwitchEnvModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SwitchEnvFeedbackModal = ({
  isOpen,
  onClose,
}: SwitchEnvModalProps): JSX.Element => {
  const { register, handleSubmit } = useForm<switchEnvFeedbackFormBodyDto>()

  // const handleFormSubmit = handleSubmit((inputs) => onsubmit(inputs))
  const { user } = useUser()
  const url = window.location.href

  const { submitSwitchEnvFormFeedbackMutation } = useEnvMutations()

  const handleSubmitForm = useCallback(
    (formInputs: switchEnvFeedbackFormBodyDto) => {
      return submitSwitchEnvFormFeedbackMutation.mutateAsync(formInputs)
    },
    [submitSwitchEnvFormFeedbackMutation],
  )

  const handleFormSubmit = handleSubmit((inputs) => handleSubmitForm(inputs))

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <chakra.form noValidate onSubmit={handleFormSubmit}>
          <ModalCloseButton />
          <ModalHeader>Something not right on the new FormSG?</ModalHeader>
          <ModalBody>
            <Stack spacing="1rem" pb="2rem">
              <FormControl>
                <Input type="hidden" {...register('url')} value={url} />
              </FormControl>
              <FormControl>
                <FormLabel>
                  Please tell us what we can improve, before you switch to the
                  original one.
                </FormLabel>
                <Textarea {...register('feedback')} />
              </FormControl>
              <FormControl>
                {user ? (
                  <Input
                    type="hidden"
                    {...register('email')}
                    value={user.email}
                  />
                ) : (
                  <>
                    <FormLabel>What's your email?</FormLabel>
                    <Input {...register('email')} />
                  </>
                )}
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit">Next</Button>
          </ModalFooter>
        </chakra.form>
      </ModalContent>
    </Modal>
  )
}
