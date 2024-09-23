import { useForm } from 'react-hook-form'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Stack,
  useBreakpointValue,
  UseDisclosureReturn,
} from '@chakra-ui/react'

import Button from '~components/Button'
import Textarea from '~components/Textarea'

import { useAssistanceMutations } from '~features/admin-form/assistance/mutations'

const TEXT_PROMPT_PLACEHOLDER = 'This is a placeholder for text prompt'

interface TextPromptInputs {
  prompt: string
}

type TextPromptModalProps = Pick<UseDisclosureReturn, 'onClose' | 'isOpen'>

export const TextPromptModal = ({
  isOpen,
  onClose,
}: TextPromptModalProps): JSX.Element => {
  const {
    reset,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TextPromptInputs>()

  const { useMakeTextPromptMutation } = useAssistanceMutations()

  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'full',
  })

  const onFormClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async ({ prompt }: TextPromptInputs) => {
    useMakeTextPromptMutation.mutate(prompt, {
      onSettled: onFormClose,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onFormClose} size={modalSize}>
      <ModalContent py={{ base: 'initial', md: '4.5rem' }}>
        <Container maxW="42.5rem">
          <ModalHeader>Write a prompt</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing="0.75rem">
                <FormControl isRequired isInvalid={!!errors.prompt}>
                  <FormLabel>
                    I want to create a form that collects...
                  </FormLabel>
                  <Textarea
                    placeholder={TEXT_PROMPT_PLACEHOLDER}
                    {...register('prompt', {
                      required: 'Please enter a prompt.',
                      maxLength: {
                        value: 200,
                        message: 'Please enter at most 200 characters.',
                      },
                    })}
                  />
                  <FormErrorMessage>{errors.prompt?.message}</FormErrorMessage>
                </FormControl>
                <Button
                  rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
                  type="submit"
                  isFullWidth
                  isLoading={useMakeTextPromptMutation.isLoading}
                >
                  Create form
                </Button>
              </Stack>
            </form>
          </ModalBody>
        </Container>
      </ModalContent>
    </Modal>
  )
}
