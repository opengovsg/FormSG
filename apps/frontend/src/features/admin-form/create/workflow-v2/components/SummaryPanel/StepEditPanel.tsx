import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BiCheck,
  BiChevronRight,
  BiLeftArrowAlt,
  BiListCheck,
  BiTrash,
  BiUser,
} from 'react-icons/bi'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Center,
  chakra,
  Divider,
  Flex,
  Icon,
  IconButton,
  Input,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import {
  focusStateSelector,
  setFocusSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

const MAX_NAME_LENGTH = 50

export const StepEditPanel = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const removeStep = useWorkflowBuilderStore((s) => s.removeStep)
  const renameStep = useWorkflowBuilderStore((s) => s.renameStep)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const stepId = focusState.type === 'step_edit' ? focusState.stepId : undefined
  const step = steps.find((s) => s.id === stepId)

  const [editName, setEditName] = useState(step?.name ?? '')

  // Sync local state if step name changes externally
  useEffect(() => {
    if (step) setEditName(step.name)
  }, [step?.name])

  const handleBack = useCallback(() => {
    if (focusState.type === 'step_edit' && focusState.returnTo) {
      setFocus({ type: 'phase', phase: focusState.returnTo })
    } else {
      setFocus({ type: 'summary' })
    }
  }, [setFocus, focusState])

  if (!step || !stepId) return <></>

  const hasRespondents = step.respondentIds.length > 0
  const hasFields = step.fieldIds.length > 0

  const handleConfirmDelete = () => {
    onClose()
    removeStep(stepId)
    setFocus({ type: 'summary' })
  }

  const handleNameBlur = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== step.name) {
      renameStep(stepId, trimmed)
    } else {
      setEditName(step.name)
    }
  }

  return (
    <Flex
      h="100%"
      flexDir="column"
      borderRight="1px solid"
      borderColor="neutral.300"
    >
      {/* Header */}
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
          aria-label="Back to summary"
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
          noOfLines={1}
        >
          Edit &ldquo;{step.name}&rdquo;
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        {/* Step name input - matching StepNamingForm style */}
        <Stack spacing="0.5rem">
          <Text textStyle="subhead-1" color="secondary.500">
            Step name
          </Text>
          <Input
            value={editName}
            onChange={(e) => {
              if (e.target.value.length <= MAX_NAME_LENGTH)
                setEditName(e.target.value)
            }}
            onBlur={handleNameBlur}
            maxLength={MAX_NAME_LENGTH}
          />
          <Text textStyle="caption-1" color="secondary.400" textAlign="right">
            ({editName.length}/{MAX_NAME_LENGTH})
          </Text>
        </Stack>

        {/* Divider below step name */}
        <Divider mx="-1.5rem" w="auto" mt="1rem" mb="1rem" />

        {/* Sub-task cards - matching SectionCard style */}
        <Stack spacing="0.5rem">
          {/* Add respondents */}
          <chakra.button
            w="100%"
            textAlign="start"
            borderRadius="8px"
            bg="transparent"
            border="2px solid"
            borderColor="transparent"
            py="0.75rem"
            px="1rem"
            cursor="pointer"
            transition="all 0.15s"
            _hover={{ bg: 'neutral.100' }}
            onClick={() =>
              setFocus({
                type: 'step_focus',
                phase: 'add_respondents',
                stepId,
                fromStepEdit: true,
              })
            }
          >
            <Flex align="center" gap="0.75rem">
              {hasRespondents ? (
                <Center
                  w="2rem"
                  h="2rem"
                  borderRadius="full"
                  bg="success.500"
                  flexShrink={0}
                >
                  <Icon as={BiCheck} fontSize="1.25rem" color="white" />
                </Center>
              ) : (
                <Center
                  w="2rem"
                  h="2rem"
                  borderRadius="full"
                  bg="neutral.200"
                  flexShrink={0}
                >
                  <Icon as={BiUser} fontSize="1.25rem" color="secondary.400" />
                </Center>
              )}
              <Text
                textStyle="subhead-1"
                color="secondary.500"
                flex={1}
                noOfLines={1}
              >
                Add people
              </Text>
              <Icon
                as={BiChevronRight}
                fontSize="1.25rem"
                color="secondary.400"
                flexShrink={0}
              />
            </Flex>
          </chakra.button>

          {/* Assign fields */}
          <chakra.button
            w="100%"
            textAlign="start"
            borderRadius="8px"
            bg="transparent"
            border="2px solid"
            borderColor="transparent"
            py="0.75rem"
            px="1rem"
            cursor="pointer"
            transition="all 0.15s"
            _hover={{ bg: 'neutral.100' }}
            onClick={() =>
              setFocus({
                type: 'step_focus',
                phase: 'assign_fields',
                stepId,
                fromStepEdit: true,
              })
            }
          >
            <Flex align="center" gap="0.75rem">
              {hasFields ? (
                <Center
                  w="2rem"
                  h="2rem"
                  borderRadius="full"
                  bg="success.500"
                  flexShrink={0}
                >
                  <Icon as={BiCheck} fontSize="1.25rem" color="white" />
                </Center>
              ) : (
                <Center
                  w="2rem"
                  h="2rem"
                  borderRadius="full"
                  bg="neutral.200"
                  flexShrink={0}
                >
                  <Icon
                    as={BiListCheck}
                    fontSize="1.25rem"
                    color="secondary.400"
                  />
                </Center>
              )}
              <Text
                textStyle="subhead-1"
                color="secondary.500"
                flex={1}
                noOfLines={1}
              >
                Choose fields
              </Text>
              <Icon
                as={BiChevronRight}
                fontSize="1.25rem"
                color="secondary.400"
                flexShrink={0}
              />
            </Flex>
          </chakra.button>
        </Stack>

        {/* Footer: delete + done */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" align="center" gap="0.5rem" py="1rem">
          {step.order > 0 && (
            <Button variant="clear" colorScheme="danger" onClick={onOpen}>
              Delete step
            </Button>
          )}
          <Button variant="outline" colorScheme="primary" onClick={handleBack}>
            Done editing
          </Button>
        </Flex>
      </Box>

      {/* Delete confirmation */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete step?
            </AlertDialogHeader>
            <AlertDialogBody color="secondary.500">
              Are you sure you want to delete this step? This action cannot be
              undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="clear">
                Cancel
              </Button>
              <Button colorScheme="danger" onClick={handleConfirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  )
}
