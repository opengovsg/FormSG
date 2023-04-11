import { useEffect, useState } from 'react'
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

import { INVALID_EMAIL_ERROR, REQUIRED_ERROR } from '~constants/validation'
import { ModalCloseButton } from '~components/Modal'

interface TransferOwnershipModalProps {
  isOpen: boolean
  onClose: () => void
}

type TransferOwnershipInputs = {
  email: string
}

export const TransferOwnershipModal = ({
  isOpen,
  onClose,
}: TransferOwnershipModalProps): JSX.Element => {
  const [page, setPage] = useState(0)
  const [email, setEmail] = useState('')

  const {
    reset,
    trigger,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferOwnershipInputs>({
    mode: 'onChange',
  })
  const onSubmit: SubmitHandler<TransferOwnershipInputs> = ({ email }) => {
    setEmail(email)
    setPage(1)
  }
  const onConfirmSubmit = () => {
    // TODO: Transfer ownership
    setPage(0)
    reset()
    onClose()
  }

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  useEffect(() => {
    trigger()
  }, [])

  // TODO: Prevent transferring ownership to self
  // TODO: Any need to ensure the new owner is a user of FormSG?
  // FIXME: Fix double modal rendering issue (see PR for screenshots)
  return (
    <Modal
      size={modalSize}
      isOpen={isOpen}
      onClose={() => {
        setPage(0)
        reset()
        onClose()
      }}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader color="secondary.700">Transfer all forms</ModalHeader>
        <ModalBody whiteSpace="pre-wrap" pb="3.25rem">
          {page === 0 && (
            <form onSubmit={handleSubmit(onSubmit)}>
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
                    validate: (value) => isEmail(value) || INVALID_EMAIL_ERROR,
                  })}
                />
                <FormErrorMessage>{errors['email']?.message}</FormErrorMessage>
              </FormControl>
              <section style={{ marginTop: '1rem', textAlign: 'right' }}>
                <ButtonGroup spacing="6">
                  <Button variant="link" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={errors['email']?.message}>
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
                  <Button variant="link">Cancel</Button>
                  <Button colorScheme="danger" onClick={onConfirmSubmit}>
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
