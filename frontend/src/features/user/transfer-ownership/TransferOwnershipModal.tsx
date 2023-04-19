import { useCallback, useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import {
  Button,
  ButtonGroup,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'
import isEmail from 'validator/lib/isEmail'

import {
  CANNOT_TRANSFER_OWNERSHIP_TO_SELF,
  INVALID_EMAIL_ERROR,
  REQUIRED_ERROR,
} from '~constants/validation'
import { ModalCloseButton } from '~components/Modal'

import { useUser } from '../queries'

interface TransferOwnershipModalProps {
  isOpen: boolean
  onClose: () => void
}

type TransferOwnershipInputs = {
  email: string
}

const useModalState = ({ onClose, reset, trigger }) => {
  const [page, setPage] = useState(0)
  const [email, setEmail] = useState('')

  const { user } = useUser()

  const isOwnEmail = useCallback(
    (value: string) => {
      return user?.email && value.toLowerCase() === user.email
    },
    [user?.email],
  )

  const resetModal = useCallback(() => {
    setPage(0)
    reset()
    trigger() // FIXME: This does not seem to trigger validation for unknown reasons.
    onClose()
  }, [page, email])

  const onNext: SubmitHandler<TransferOwnershipInputs> = useCallback(
    ({ email }) => {
      setEmail(email)
      setPage(1)
    },
    [page, email],
  )

  const onConfirm = useCallback(() => {
    // TODO: Call Transfer ownership API
    resetModal()
  }, [page, email])

  useEffect(() => {
    trigger()
  }, [])

  return [
    { page, email },
    { isOwnEmail, resetModal, onNext, onConfirm },
  ]
}

export const TransferOwnershipModal = ({
  isOpen,
  onClose,
}: TransferOwnershipModalProps): JSX.Element => {
  const {
    reset,
    trigger,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferOwnershipInputs>({
    mode: 'onChange',
  })
  const [{ page, email }, { isOwnEmail, resetModal, onNext, onConfirm }] =
    useModalState({
      onClose,
      reset,
      trigger,
    })

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  // TODO: Any need to ensure the new owner is a user of FormSG?
  return (
    <Modal size={modalSize} isOpen={isOpen} onClose={resetModal!}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">Transfer all forms</ModalHeader>
        <ModalBody whiteSpace="pre-wrap" pb="3.25rem">
          {page === 0 && (
            <form onSubmit={handleSubmit(onNext!)}>
              <FormControl isInvalid={!!errors['email']}>
                <FormLabel>
                  Transfer ownership of all forms
                  <Text textStyle="body-2" color="secondary.500">
                    Share your secret key with this user for them to access
                    response data
                  </Text>
                </FormLabel>
                <Input
                  type="email"
                  placeholder="me@example.com"
                  {...register('email', {
                    required: REQUIRED_ERROR,
                    validate: (value) => {
                      if (!isEmail(value)) {
                        return INVALID_EMAIL_ERROR
                      }
                      return (
                        !isOwnEmail!(value) || CANNOT_TRANSFER_OWNERSHIP_TO_SELF
                      )
                    },
                  })}
                />
                <FormErrorMessage>{errors['email']?.message}</FormErrorMessage>
              </FormControl>
              <section style={{ marginTop: '1rem', textAlign: 'right' }}>
                <ButtonGroup spacing="6">
                  <Button variant="link" onClick={resetModal}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!!errors['email']}>
                    Transfer ownership
                  </Button>
                </ButtonGroup>
              </section>
            </form>
          )}
          {page === 1 && (
            <section>
              <Text textStyle="body-2" color="secondary.500">
                You are transferring all forms to{' '}
                <Text as="span" color="danger.500" fontWeight="bold">
                  {email}
                </Text>
                . You will be removed as a collaborator and lose access to the
                forms you previously owned.
              </Text>
              <section style={{ marginTop: '1rem', textAlign: 'right' }}>
                <ButtonGroup spacing="6">
                  <Button variant="link" onClick={resetModal}>
                    Cancel
                  </Button>
                  <Button colorScheme="danger" onClick={onConfirm}>
                    Yes, transfer all forms
                  </Button>
                </ButtonGroup>
              </section>
            </section>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
