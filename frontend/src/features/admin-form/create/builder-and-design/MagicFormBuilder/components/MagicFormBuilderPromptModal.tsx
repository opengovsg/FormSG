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
    label: 'Approval of request (AOR)',
    prompt:
      'Create a purchase request application form which is to be approved by a manager, including sections for requester information, a section for details of items purchased in a table field (which may include name, quantity, unit price, total price, and justification for purchase), and a section for approval by manager.',
  },
  {
    label: 'Data consent form',
    prompt:
      'Create a data collection consent form, including a section for personal details, a section for sample data usage purposes and terms and conditions, and a section for agreement to the above.',
  },
  {
    label: 'MOP feedback',
    prompt:
      'Create a feedback survey for members of public, including rating scales for service quality satisfaction, justification for rating, specific feedback on what is good and what is bad and potential suggestions for improvement for each aspect.',
  },
  {
    label: 'Sign-in/out timesheet',
    prompt:
      'Create a sign-in and out timesheet form to be filled each time an employee enters and leaves the office, including a section for employee information, a section for recording of visit date and time, whether it is a sign in or sign out, and a section for purpose of visit.',
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
      <Text textStyle="subhead-1">Need inspiration? Try one of these:</Text>
      <HStack
        display="flex"
        justifyContent="space-between"
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
            borderRadius="4px"
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

const GENERATE_FORM_PLACEHOLDER =
  'Describe your form, including fields and sections to create'

export interface TextPromptInputs {
  prompt: string
}

const MagicFormBuilderCreateFormPrompt = ({
  onSubmit,
  isSubmitLoading,
  onCancel,
}: {
  onSubmit: (textPromptInputs: string) => void
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
      <ModalHeader textStyle="h2">Create fields with AI</ModalHeader>
      <ModalBody>
        <FormControl isRequired isInvalid={!!errors.prompt?.message}>
          <FormLabel textStyle="subhead-1">
            I want to create a form for...
          </FormLabel>
          <Textarea
            borderRadius="4px"
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
          handleNext={handleSubmit(({ prompt }) => onSubmit(prompt))}
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
  onSubmit: (textPrompt: string) => void
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
