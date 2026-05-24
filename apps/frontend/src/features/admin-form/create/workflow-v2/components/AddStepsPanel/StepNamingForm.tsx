import { useCallback, useEffect, useRef, useState } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import {
  Box,
  Button,
  Divider,
  Flex,
  IconButton,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import {
  focusStateSelector,
  setFocusSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { STEP_TYPE_CONFIG } from './StepTypeCard'

const MAX_NAME_LENGTH = 50

export const StepNamingForm = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const addStep = useWorkflowBuilderStore((s) => s.addStep)
  const setPreviewStepName = useWorkflowBuilderStore(
    (s) => s.setPreviewStepName,
  )

  // Guard: only render in step_naming state
  if (focusState.type !== 'step_naming') return <></>

  const { stepType, insertIndex } = focusState
  const config = STEP_TYPE_CONFIG[stepType]

  return (
    <StepNamingFormInner
      key={`${stepType}-${insertIndex}`}
      stepType={stepType}
      insertIndex={insertIndex}
      defaultName={`Step ${insertIndex + 1}`}
      displayTitle={stepType === 'review' ? 'Review and approve' : config.title}
      setFocus={setFocus}
      addStep={addStep}
      setPreviewStepName={setPreviewStepName}
    />
  )
}

type InnerProps = {
  stepType: 'collect' | 'review'
  insertIndex: number
  defaultName: string
  displayTitle: string
  setFocus: ReturnType<typeof setFocusSelector>
  addStep: (type: 'collect' | 'review', name: string, index: number) => void
  setPreviewStepName: (name: string | null) => void
}

const StepNamingFormInner = ({
  stepType,
  insertIndex,
  defaultName,
  displayTitle,
  setFocus,
  addStep,
  setPreviewStepName,
}: InnerProps): JSX.Element => {
  const [name, setName] = useState(defaultName)
  const inputRef = useRef<HTMLInputElement>(null)

  // Set initial preview and auto-focus
  useEffect(() => {
    setPreviewStepName(defaultName)
    inputRef.current?.focus()
    inputRef.current?.select()
    return () => {
      setPreviewStepName(null)
    }
  }, [defaultName, setPreviewStepName])

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value.length <= MAX_NAME_LENGTH) {
        setName(e.target.value)
        setPreviewStepName(e.target.value)
      }
    },
    [setPreviewStepName],
  )

  const handleCancel = useCallback(() => {
    setPreviewStepName(null)
    setFocus({ type: 'phase', phase: 'add_steps' })
  }, [setFocus, setPreviewStepName])

  const handleSave = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) return
    setPreviewStepName(null)
    addStep(stepType, trimmed, insertIndex)
    setFocus({ type: 'phase', phase: 'add_steps' })
  }, [name, stepType, insertIndex, addStep, setFocus, setPreviewStepName])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave()
      if (e.key === 'Escape') handleCancel()
    },
    [handleSave, handleCancel],
  )

  return (
    <Flex
      h="100%"
      flexDir="column"
      borderRight="1px solid"
      borderColor="neutral.300"
    >
      {/* Header - matches BuilderDrawerContainer pattern */}
      <Stack
        direction="row"
        pos="sticky"
        top={0}
        px="1.5rem"
        py="1rem"
        align="center"
        borderBottom="1px solid"
        borderColor="neutral.300"
        bg="white"
        zIndex={1}
      >
        <IconButton
          aria-label="Back to Add steps"
          icon={<BiLeftArrowAlt fontSize="1.25rem" />}
          variant="clear"
          colorScheme="secondary"
          size="sm"
          h="1.5rem"
          w="1.5rem"
          onClick={handleCancel}
        />
        <Text
          textStyle="h4"
          as="h4"
          color="secondary.500"
          flex={1}
          textAlign="center"
        >
          Add &ldquo;{displayTitle}&rdquo;
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Form content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        <Stack spacing="0.5rem">
          <Text textStyle="subhead-2" color="secondary.500">
            Step name
          </Text>
          <Input
            ref={inputRef}
            value={name}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            maxLength={MAX_NAME_LENGTH}
          />
          <Text textStyle="caption-1" color="secondary.400" textAlign="right">
            ({name.length}/{MAX_NAME_LENGTH})
          </Text>
        </Stack>
        {/* CTA - flows after content */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" gap="0.75rem" py="1rem">
          <Button
            variant="clear"
            colorScheme="secondary"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            colorScheme="primary"
            onClick={handleSave}
            isDisabled={!name.trim()}
          >
            Save step
          </Button>
        </Flex>
      </Box>
    </Flex>
  )
}
