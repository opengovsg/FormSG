// TODO #4279: Remove after React rollout is complete
import { useCallback, useRef } from 'react'
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

import { AdminFeedbackFormDto } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import { useToast } from '~hooks/useToast'
import Button from '~components/Button'
import Rating from '~components/Field/Rating'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import { ModalCloseButton } from '~components/Modal'
import Textarea from '~components/Textarea'

import { useUser } from '~features/user/queries'

import { useAdminFeedbackMutation } from './mutations'

export const AdminFeedbackModal = ({
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
  const toast = useToast({ status: 'success', isClosable: true })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AdminFeedbackFormDto>()

  const initialRef = useRef(null)

  const { user } = useUser()
  const url = window.location.href
  const rumSessionId = datadogRum.getInternalContext()?.session_id

  const adminFeedbackMutation = useAdminFeedbackMutation()

  const handleSubmitForm = handleSubmit((inputs: AdminFeedbackFormDto) => {
    adminFeedbackMutation.mutateAsync(inputs)
    toast({ description: 'Your feedback has been submitted.' })
    onClose()
  })

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

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
        <chakra.form noValidate onSubmit={handleSubmitForm}>
          <ModalHeader pr="48px">Share your feedback</ModalHeader>
          <ModalBody mt="0" pt="0">
            <Stack spacing="1rem">
              <FormControl>
                <Input type="hidden" {...register('url')} value={url} />
              </FormControl>

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
                <FormErrorMessage>{errors['rating']?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Do you have any other feedback for us?</FormLabel>
                <Textarea {...register('feedback')} />
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
              <Button isFullWidth={isMobile} variant="clear" onClick={onClose}>
                Cancel
              </Button>
              <Button isFullWidth={isMobile} type="submit">
                Submit feedback
              </Button>
            </Stack>
          </ModalFooter>
        </chakra.form>
      </ModalContent>
    </Modal>
  )
}
