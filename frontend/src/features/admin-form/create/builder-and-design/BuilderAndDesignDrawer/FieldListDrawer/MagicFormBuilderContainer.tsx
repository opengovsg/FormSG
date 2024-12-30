import { forwardRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { BiSolidMagicWand, BiTrash } from 'react-icons/bi'
import { HiSparkles } from 'react-icons/hi2'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  Portal,
  Text,
  Textarea,
  Tooltip,
} from '@chakra-ui/react'

import { BxCheck } from '~/assets/icons'

import { useIsMobile } from '~hooks/useIsMobile'
import { FormErrorMessage } from '~components/FormControl/FormErrorMessage/FormErrorMessage'

import { useAssistanceMutations } from '~features/admin-form/assistance/mutations'

import { useDeleteFormField } from '../../mutations/useDeleteFormField'
import {
  recentlyCreatedFieldIdsSelector,
  useMagicFormBuilderStore,
} from '../../useMagicFormBuilderStore'

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

const GENERATE_FORM_PLACEHOLDER = 'Describe form, fields and sections to create'

export const MagicFormBuilderContainer = () => {
  const { formId } = useParams()
  const isMobile = useIsMobile()

  const [isOpen, setIsOpen] = useState(false)

  const clearRecentlyCreatedFieldIds = useMagicFormBuilderStore(
    (state) => state.clearRecentlyCreatedFieldIds,
  )
  const recentlyCreatedFieldIds = useMagicFormBuilderStore(
    recentlyCreatedFieldIdsSelector,
  )

  const onClickDefaults = () => {
    setIsOpen(false)
    if (formId) {
      setTimeout(() => {
        clearRecentlyCreatedFieldIds(formId)
      }, 100) // only clear after the popover is closed
    }
  }

  const { deleteMultipleFormFieldsMutation } = useDeleteFormField()

  const fieldIds = formId ? recentlyCreatedFieldIds[formId] : null
  const isAcceptDenyOpen = !!fieldIds && fieldIds.size > 0

  return !isMobile ? (
    <MagicFormBuilderPopover
      isOpen={isOpen}
      isAcceptDenyOpen={isAcceptDenyOpen}
      onMfbClick={() => setIsOpen(!isOpen)}
      onClose={() => setIsOpen(false)}
      onAccept={onClickDefaults}
      onDeny={() => {
        onClickDefaults()
        if (!formId) return
        deleteMultipleFormFieldsMutation.mutate(
          Array.from(recentlyCreatedFieldIds[formId]),
        )
      }}
    />
  ) : null
}

const MagicFormBuilderButton = forwardRef(
  (
    {
      isActive,
      onClick,
      ...styleProps
    }: { isActive: boolean; onClick: () => void } & React.ComponentProps<
      typeof Button
    >,
    ref,
  ) => {
    return (
      <Tooltip openDelay={500} hasArrow label="Create fields with AI">
        <Button
          ref={ref} // Rationale: forward ref allows the popover placement to work.
          variant="outline"
          onClick={onClick}
          padding="0"
          borderColor="primary.200"
          backgroundColor={isActive ? 'primary.200' : undefined}
          _hover={{
            backgroundColor: 'primary.200',
          }}
          borderWidth="1px"
          {...styleProps}
        >
          <Icon as={BiSolidMagicWand} color="primary.500" fontSize="1.5rem" />
        </Button>
      </Tooltip>
    )
  },
)
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
      <Text textStyle="body-2">Or, try a sample:</Text>
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

const MagicFormBuilderCreateFormPrompt = ({
  onClose,
}: {
  onClose: () => void
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TextPromptInputs>()

  const { useMakeTextPromptMutation } = useAssistanceMutations()

  const onSubmit = async ({ prompt }: TextPromptInputs) => {
    useMakeTextPromptMutation.mutate(prompt)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <PopoverHeader>
        <Text textStyle="h4">Generate form</Text>
      </PopoverHeader>
      <PopoverCloseButton onClick={onClose} />
      <PopoverBody>
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
      </PopoverBody>
      <PopoverFooter>
        <Flex justifyContent="flex-end">
          <Button
            leftIcon={<HiSparkles fontSize="1.5rem" />}
            type="submit"
            isLoading={useMakeTextPromptMutation.isLoading}
          >
            Generate
          </Button>
        </Flex>
      </PopoverFooter>
    </form>
  )
}

const MagicFormBuilderAcceptDeny = ({
  onAccept,
  onDeny,
  onClose,
}: {
  onAccept: () => void
  onDeny: () => void
  onClose: () => void
}) => {
  return (
    <>
      <PopoverHeader>
        <Text textStyle="h4">Keep these changes?</Text>
      </PopoverHeader>
      <PopoverCloseButton onClick={onClose} />
      <PopoverBody>
        <Flex direction="column" gap="0.25rem">
          <Button
            leftIcon={<BxCheck />}
            variant="solid"
            onClick={onAccept}
            colorScheme="success"
          >
            Accept
          </Button>
          <Button
            leftIcon={<BiTrash />}
            variant="solid"
            onClick={onDeny}
            colorScheme="danger"
          >
            Deny
          </Button>
        </Flex>
      </PopoverBody>
    </>
  )
}

interface TextPromptInputs {
  prompt: string
}

export const MagicFormBuilderPopover = ({
  isOpen,
  onMfbClick,
  onClose,
  isAcceptDenyOpen,
  onAccept,
  onDeny,
}: {
  isOpen: boolean
  onMfbClick: () => void
  onClose: () => void
  isAcceptDenyOpen: boolean
  onAccept: () => void
  onDeny: () => void
}) => {
  return (
    <Popover isLazy placement="right-start" isOpen={isOpen}>
      <PopoverAnchor>
        <MagicFormBuilderButton isActive={isOpen} onClick={onMfbClick} />
      </PopoverAnchor>
      <Portal>
        <PopoverContent bg="white">
          {!isAcceptDenyOpen ? (
            <MagicFormBuilderCreateFormPrompt onClose={onClose} />
          ) : (
            <MagicFormBuilderAcceptDeny
              onAccept={onAccept}
              onDeny={onDeny}
              onClose={onClose}
            />
          )}
        </PopoverContent>
      </Portal>
    </Popover>
  )
}
