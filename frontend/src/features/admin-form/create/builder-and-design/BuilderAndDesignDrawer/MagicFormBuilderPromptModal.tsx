import { useForm } from 'react-hook-form'
import { HiSparkles } from 'react-icons/hi2'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
} from '@chakra-ui/react'

import { NextAndBackButtonGroup } from '~components/Button'

const TEXT_PROMPT_IDEAS = [
  {
    label: 'Employee satisfaction survey',
    prompt:
      'employee feedback on workplace satisfaction, including fields on overall job satisfaction, suggestions for improvement, and comments on company culture.',
  },
  {
    label: 'Community issue reports',
    prompt:
      'community issue reports from citizens, including fields for location, description of the issue, and optional photo uploads.',
  },
  {
    label: 'Government grant applications',
    prompt:
      'applications for government grants from business entities, incorporating sections for project details, budget breakdown, and applicant qualifications.',
  },
]

const PromptSelectorBar = ({
  promptIdeas,
  onClick,
}: {
  promptIdeas: {
    label: string
    prompt: string
  }[]
  onClick: (prompt: string) => void
}) => {
  return (
    <Flex direction="column">
      <Text textStyle="body-2">Need inspiration? Try one of these:</Text>
      <HStack
        overflowX="auto"
        gap="0.25rem"
        mt="0.25rem"
        pt="0.25rem"
        pb="1rem"
      >
        {promptIdeas.map((idea) => (
          <Button
            key={idea.label}
            variant="clear"
            size="xs"
            borderRadius="3rem"
            bgColor="secondary.100"
            _hover={{
              backgroundColor: 'primary.200',
            }}
            onClick={() => onClick(idea.prompt)}
          >
            {idea.label}
          </Button>
        ))}
      </HStack>
    </Flex>
  )
}

const GENERATE_FORM_PLACEHOLDER = 'Describe form, fields and sections to create'

export interface TextPromptInputs {
  prompt: string
}

const MagicFormBuilderCreateFormPrompt = ({
  onSubmit,
  isSubmitLoading,
  onCancel,
}: {
  onSubmit: (textPromptInputs: TextPromptInputs) => void
  isSubmitLoading: boolean
  onCancel: () => void
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TextPromptInputs>()

  return (
    <>
      <ModalHeader>Create fields with AI</ModalHeader>
      <ModalBody>
        <FormControl isRequired isInvalid={!!errors.prompt?.message}>
          <FormLabel>I want to create a form that collects</FormLabel>
          <Textarea
            placeholder={GENERATE_FORM_PLACEHOLDER}
            {...register('prompt', {
              required: 'Please enter a prompt.',
              maxLength: {
                value: 500,
                message: 'Please enter at most 500 characters.',
              },
            })}
          />
          <FormErrorMessage>{errors.prompt?.message}</FormErrorMessage>
        </FormControl>
        <Box mt="0.5rem">
          <PromptSelectorBar
            promptIdeas={TEXT_PROMPT_IDEAS}
            onClick={(prompt) => setValue('prompt', prompt)}
          />
        </Box>
      </ModalBody>
      <ModalFooter justifyContent="flex-end">
        <NextAndBackButtonGroup
          nextButtonIcon={<HiSparkles fontSize="1.5rem" />}
          handleNext={handleSubmit(onSubmit)}
          isNextLoading={isSubmitLoading}
          handleBack={onCancel}
          nextButtonLabel="Generate fields"
          backButtonLabel="Cancel"
        />
      </ModalFooter>
    </>
  )
}

interface MagicFormBuilderPromptModalProps {
  isOpen: boolean
  onSubmit: (textPromptInputs: TextPromptInputs) => void
  isSubmitLoading: boolean
  onClose: () => void
}

const MagicFormBuilderPromptModal = ({
  isOpen,
  onSubmit,
  isSubmitLoading,
  onClose,
}: MagicFormBuilderPromptModalProps): JSX.Element => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <MagicFormBuilderCreateFormPrompt
          onSubmit={onSubmit}
          isSubmitLoading={isSubmitLoading}
          onCancel={onClose}
        />
      </ModalContent>
    </Modal>
  )
}

export default MagicFormBuilderPromptModal
