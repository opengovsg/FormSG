import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import {
  chakra,
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
  Wrap,
} from '@chakra-ui/react'
import { isEmpty } from 'lodash'
import isEmail from 'validator/lib/isEmail'

import { BasicField } from '~shared/types'
import { PreSubmitFormFeedbackBodyDto } from '~shared/types/form'

import { INVALID_EMAIL_ERROR, REQUIRED_ERROR } from '~constants/validation'
import { useIsMobile } from '~hooks/useIsMobile'
import { useToast } from '~hooks/useToast'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import { ModalCloseButton } from '~components/Modal'
import Textarea from '~components/Textarea'

export const FormPreSubmissionFeedbackModal = ({
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
    formState: { errors },
  } = useForm<PreSubmitFormFeedbackBodyDto>()

  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  // const { mutationFn } = useMutation(submitPreSubmissionFeedback)
  const handleSubmitForm = handleSubmit(() => {
    toast({ description: 'Your feedback has been submitted.' })
    onClose()
  })

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <chakra.form noValidate onSubmit={handleSubmitForm}>
          <ModalHeader
            pt="2rem"
            pb={{ base: '1.625rem', xs: '2rem' }}
            pr="4rem"
          >
            <Text textStyle={{ base: '1.25rem', md: '1.5rem' }}>
              Have trouble filling out this form?
            </Text>
          </ModalHeader>
          <ModalBody>
            <Stack>
              <FormControl isInvalid={!isEmpty(errors)}>
                <FormLabel
                  isRequired={true}
                  description={'This will be sent to the form creator.'}
                >
                  Please describe the issue you encountered.
                </FormLabel>
                <Textarea
                  {...register('issue', {
                    validate: { notEmpty: (value) => !value || REQUIRED_ERROR },
                  })}
                />
                <FormLabel
                  pt="1rem"
                  description="Leave your email or contact number so the form creator can reach out to you if needed."
                >
                  Contact
                </FormLabel>
                <Input
                  type={BasicField.Email}
                  placeholder="me@example.com"
                  {...register('email', {
                    validate: {
                      validEmail: (value) =>
                        !value || isEmail(value) || INVALID_EMAIL_ERROR,
                    },
                  })}
                />
                <FormErrorMessage>
                  {errors.email && errors.email.message}
                </FormErrorMessage>
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
              <Button isFullWidth={isMobile} variant="clear" onClick={onClose}>
                Cancel
              </Button>
              <Button isFullWidth={isMobile} type="submit">
                Send report
              </Button>
            </Stack>
          </ModalFooter>
        </chakra.form>
      </ModalContent>
    </Modal>
  )
}
