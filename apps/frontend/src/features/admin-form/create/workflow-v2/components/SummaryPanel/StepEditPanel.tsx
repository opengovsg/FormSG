import { useCallback, useRef } from 'react'
import { BiCheck, BiLeftArrowAlt, BiListCheck, BiUser } from 'react-icons/bi'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
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

export const StepEditPanel = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const removeStep = useWorkflowBuilderStore((s) => s.removeStep)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const stepId = focusState.type === 'step_edit' ? focusState.stepId : undefined
  const step = steps.find((s) => s.id === stepId)

  const handleBack = useCallback(() => {
    setFocus({ type: 'summary' })
  }, [setFocus])

  if (!step || !stepId) return <></>

  const truncatedName =
    step.name.length > 25 ? step.name.slice(0, 25) + '...' : step.name

  const hasRespondents = step.respondentIds.length > 0
  const hasFields = step.fieldIds.length > 0 || step.approvalFieldIds.length > 0

  const handleConfirmDelete = () => {
    onClose()
    removeStep(stepId)
    setFocus({ type: 'summary' })
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
          Edit &ldquo;{truncatedName}&rdquo;
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1.5rem" pb="1.5rem">
        <Stack spacing="0.75rem">
          {/* Add respondents sub-task card */}
          <Box
            as="button"
            type="button"
            w="100%"
            textAlign="start"
            borderRadius="8px"
            border="1px solid"
            borderColor="neutral.300"
            bg="white"
            p="1rem"
            cursor="pointer"
            _hover={{ borderColor: 'primary.500', bg: 'primary.100' }}
            transition="border-color 0.2s, background 0.2s"
            onClick={() =>
              setFocus({
                type: 'step_focus',
                phase: 'add_respondents',
                stepId,
              })
            }
          >
            <HStack spacing="0.75rem">
              {hasRespondents ? (
                <Flex
                  w="1.5rem"
                  h="1.5rem"
                  borderRadius="full"
                  bg="success.500"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={BiCheck} color="white" fontSize="1rem" />
                </Flex>
              ) : (
                <Icon
                  as={BiUser}
                  fontSize="1.5rem"
                  color="secondary.400"
                  flexShrink={0}
                />
              )}
              <Text textStyle="subhead-1" color="secondary.500">
                Add respondents
              </Text>
            </HStack>
          </Box>

          {/* Assign fields sub-task card */}
          <Box
            as="button"
            type="button"
            w="100%"
            textAlign="start"
            borderRadius="8px"
            border="1px solid"
            borderColor="neutral.300"
            bg="white"
            p="1rem"
            cursor="pointer"
            _hover={{ borderColor: 'primary.500', bg: 'primary.100' }}
            transition="border-color 0.2s, background 0.2s"
            onClick={() =>
              setFocus({
                type: 'step_focus',
                phase: 'assign_fields',
                stepId,
              })
            }
          >
            <HStack spacing="0.75rem">
              {hasFields ? (
                <Flex
                  w="1.5rem"
                  h="1.5rem"
                  borderRadius="full"
                  bg="success.500"
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon as={BiCheck} color="white" fontSize="1rem" />
                </Flex>
              ) : (
                <Icon
                  as={BiListCheck}
                  fontSize="1.5rem"
                  color="secondary.400"
                  flexShrink={0}
                />
              )}
              <Text textStyle="subhead-1" color="secondary.500">
                Assign fields
              </Text>
            </HStack>
          </Box>
        </Stack>

        {/* Delete step */}
        {step.order > 0 && (
          <>
            <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
            <Flex py="1rem">
              <Button
                variant="clear"
                colorScheme="danger"
                size="sm"
                onClick={onOpen}
              >
                Delete step
              </Button>
            </Flex>
          </>
        )}

        {/* Done editing */}
        <Divider mx="-1.5rem" w="auto" mt={step.order === 0 ? '1.5rem' : 0} />
        <Flex justify="flex-end" py="1rem">
          <Button variant="clear" colorScheme="primary" onClick={handleBack}>
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
