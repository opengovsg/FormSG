import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
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
} from '@chakra-ui/react'
import {
  Button,
  FormErrorMessage,
  FormLabel,
  Input,
  ModalCloseButton,
  Textarea,
  useToast,
} from '@opengovsg/design-system-react'
import isEmail from 'validator/lib/isEmail'

import { BasicField, SubmitFormIssueBodyDto } from '~shared/types'

import { INVALID_EMAIL_ERROR, REQUIRED_ERROR } from '~constants/validation'
import { useIsMobile } from '~hooks/useIsMobile'

import { useSubmitFormIssueMutations } from '~features/public-form/mutations'

export interface FormIssueFeedbackProps {
  isOpen: boolean
  onClose: () => void
  isPreview: boolean
  formId: string
}

export const FormIssueFeedbackModal = ({
  isOpen,
  onClose,
  isPreview,
  formId,
}: FormIssueFeedbackProps): JSX.Element | null => {
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })
  const isMobile = useIsMobile()
  const toast = useToast({ status: 'success', isClosable: true })

  const { submitFormIssueMutation } = useSubmitFormIssueMutations(formId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubmitFormIssueBodyDto>({
    defaultValues: { issue: '', email: '' },
  })

  const handleSubmitIssue = handleSubmit((inputs: SubmitFormIssueBodyDto) => {
    if (isPreview) {
      reset()
      toast({
        description:
          'Thank you for submitting your feedback! Since you are in preview mode, the feedback is not stored.',
      })
    } else {
      submitFormIssueMutation.mutate(inputs, {
        onSuccess: () => {
          reset()
          toast({
            description: 'Thank you for submitting your feedback!',
            status: 'success',
            isClosable: true,
          })
        },
      })
    }
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
        <chakra.form noValidate onSubmit={handleSubmitIssue}>
          <ModalHeader
            pt="2rem"
            pb={{ base: '1.625rem', xs: '2rem' }}
            pr="4rem"
          >
            <Text textStyle={{ base: '1.25rem', md: '1.5rem' }}>
              Report an issue
            </Text>
          </ModalHeader>
          <ModalBody>
            <Text pb="1.5rem" textStyle="body-2" mt="0">
              Fill this in only{' '}
              <span style={{ fontWeight: 'bold' }}>
                if you are experiencing issues and are unable to submit this
                form
              </span>
              . If you would like to provide feedback, you can do so after
              submitting the form.
            </Text>
            <Stack>
              <FormControl isInvalid={!!errors.issue}>
                <FormLabel isRequired={true}>
                  Please describe the issue you encountered
                </FormLabel>
                <Textarea
                  {...register('issue', {
                    required: REQUIRED_ERROR,
                  })}
                />
                <FormErrorMessage>
                  {errors.issue && errors.issue.message}
                </FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.email}>
                <FormLabel pt="1rem">Contact</FormLabel>
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
