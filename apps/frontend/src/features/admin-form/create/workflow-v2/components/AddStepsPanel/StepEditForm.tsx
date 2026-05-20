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
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

const MAX_NAME_LENGTH = 50

export const StepEditForm = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const renameStep = useWorkflowBuilderStore((s) => s.renameStep)

  if (focusState.type !== 'step_edit') return <></>

  const step = steps.find((s) => s.id === focusState.stepId)
  if (!step) return <></>

  return (
    <StepEditFormInner
      key={step.id}
      stepId={step.id}
      currentName={step.name}
      setFocus={setFocus}
      renameStep={renameStep}
    />
  )
}

type InnerProps = {
  stepId: string
  currentName: string
  setFocus: ReturnType<typeof setFocusSelector>
  renameStep: (stepId: string, name: string) => void
}

const StepEditFormInner = ({
  stepId,
  currentName,
  setFocus,
  renameStep,
}: InnerProps): JSX.Element => {
  const [name, setName] = useState(currentName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleBack = useCallback(() => {
    setFocus({ type: 'phase', phase: 'add_steps' })
  }, [setFocus])

  const handleSave = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) return
    renameStep(stepId, trimmed)
    setFocus({ type: 'phase', phase: 'add_steps' })
  }, [name, stepId, renameStep, setFocus])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave()
      if (e.key === 'Escape') handleBack()
    },
    [handleSave, handleBack],
  )

  return (
    <Flex
      h="100%"
      flexDir="column"
      borderRight="1px solid"
      borderColor="neutral.300"
    >
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
          onClick={handleBack}
        />
        <Text
          textStyle="h4"
          as="h4"
          color="secondary.500"
          flex={1}
          textAlign="center"
        >
          Edit step name
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        <Stack spacing="0.5rem">
          <Text textStyle="subhead-2" color="secondary.500">
            Step name
          </Text>
          <Input
            ref={inputRef}
            value={name}
            onChange={(e) => {
              if (e.target.value.length <= MAX_NAME_LENGTH) {
                setName(e.target.value)
              }
            }}
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
          <Button variant="clear" colorScheme="secondary" onClick={handleBack}>
            Cancel
          </Button>
          <Button
            colorScheme="primary"
            onClick={handleSave}
            isDisabled={!name.trim()}
          >
            Save
          </Button>
        </Flex>
      </Box>
    </Flex>
  )
}
