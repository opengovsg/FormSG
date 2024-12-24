import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { BiSolidMagicWand, BiTrash } from 'react-icons/bi'
import { HiSparkles } from 'react-icons/hi2'
import {
  Button,
  Flex,
  FormControl,
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

const GENERATE_FORM_PLACEHOLDER =
  'Describe form, fields and sections to create...'

export const MagicFormBuilderContainer = () => {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)

  return !isMobile ? (
    <>
      <MagicFormBuilderPopover isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  ) : null
}

const MagicFormBuilderButton = ({
  onClick,
  ...styleProps
}: { onClick: () => void } & React.ComponentProps<typeof Button>) => {
  return (
    <Tooltip openDelay={500} hasArrow label="Create fields with AI">
      <Button
        onClick={onClick}
        padding="0"
        backgroundColor="primary.200"
        _hover={{
          backgroundColor: 'primary.300',
        }}
        borderWidth={0}
        {...styleProps}
      >
        <Icon as={BiSolidMagicWand} color="primary.500" fontSize="1.5rem" />
      </Button>
    </Tooltip>
  )
}

const MagicFormBuilderCreateFormPrompt = ({
  onSettled,
  onClose,
}: {
  onSettled: () => void
  onClose: () => void
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TextPromptInputs>()

  const { useMakeTextPromptMutation } = useAssistanceMutations()

  const onSubmit = async ({ prompt }: TextPromptInputs) => {
    useMakeTextPromptMutation.mutate(prompt, {
      onSettled: onSettled,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <PopoverHeader>
        <Text textStyle="h4">Generate form</Text>
      </PopoverHeader>
      <PopoverCloseButton onClick={onClose} />
      <PopoverBody>
        <FormControl isRequired isInvalid={false}>
          <Textarea
            placeholder={GENERATE_FORM_PLACEHOLDER}
            {...register('prompt', {
              required: 'Please enter a prompt.',
              maxLength: {
                value: 30,
                message: 'Please enter at most 500 characters.',
              },
            })}
          />
          <FormErrorMessage>{errors.prompt?.message}</FormErrorMessage>
        </FormControl>
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

const MagicFormBuilderPopover = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}) => {
  const [isAcceptDenyOpen, setIsAcceptDenyOpen] = useState(false)
  const clearRecentlyCreatedFieldIds = useMagicFormBuilderStore(
    (state) => state.clearRecentlyCreatedFieldIds,
  )
  const recentlyCreatedFieldIds = useMagicFormBuilderStore(
    recentlyCreatedFieldIdsSelector,
  )

  const onClickDefaults = () => {
    clearRecentlyCreatedFieldIds()
    setIsOpen(false)
    setTimeout(() => setIsAcceptDenyOpen(false), 100) // delay to allow popover to close before updating state
  }

  const { deleteMultipleFormFieldsMutation } = useDeleteFormField()

  return (
    <Popover isLazy placement="right" isOpen={isOpen}>
      <PopoverAnchor>
        <MagicFormBuilderButton onClick={() => setIsOpen(!isOpen)} />
      </PopoverAnchor>
      <Portal>
        {/* TODO: (MFBv1.1) Fix the position of the popover. */}
        <PopoverContent bg="white" top="15vh" left="40vw">
          {!isAcceptDenyOpen ? (
            <MagicFormBuilderCreateFormPrompt
              onClose={() => setIsOpen(false)}
              onSettled={() => setIsAcceptDenyOpen(true)}
            />
          ) : (
            <MagicFormBuilderAcceptDeny
              onAccept={onClickDefaults}
              onDeny={() => {
                deleteMultipleFormFieldsMutation.mutate(
                  Array.from(recentlyCreatedFieldIds),
                )
                onClickDefaults()
              }}
              onClose={() => setIsOpen(false)}
            />
          )}
        </PopoverContent>
      </Portal>
    </Popover>
  )
}
