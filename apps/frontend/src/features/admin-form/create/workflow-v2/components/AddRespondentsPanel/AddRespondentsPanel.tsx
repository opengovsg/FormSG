import { useCallback, useMemo, useState } from 'react'
import { BiLeftArrowAlt, BiPlus } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
} from '@chakra-ui/react'

import { ModalCloseButton } from '~components/Modal'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import {
  fieldsSelector,
  respondentsSelector,
  setFocusSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { RespondentCard } from './RespondentCard'

const deletingRespondentIdSelector = (s: {
  deletingRespondentId: string | null
}) => s.deletingRespondentId

export const AddRespondentsPanel = (): JSX.Element => {
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const deletingRespondentId = useWorkflowBuilderStore(
    deletingRespondentIdSelector,
  )
  const { formId } = useParams()
  const [showCreateFieldsModal, setShowCreateFieldsModal] = useState(false)

  // Check if user has content fields (beyond respondent-linked ones)
  const hasContentFields = useMemo(() => {
    const respondentLinkedFieldIds = new Set(
      respondents.map((r) => r.linkedFieldId).filter(Boolean),
    )
    return fields.some((f) => !respondentLinkedFieldIds.has(f.id))
  }, [fields, respondents])

  const handleBack = useCallback(() => {
    setFocus({ type: 'summary' })
  }, [setFocus])

  const handlePrevPhase = useCallback(() => {
    setFocus({ type: 'phase', phase: 'add_steps' })
  }, [setFocus])

  const handleNext = useCallback(() => {
    if (hasContentFields) {
      setFocus({ type: 'phase', phase: 'assign_fields' })
    } else {
      setShowCreateFieldsModal(true)
    }
  }, [hasContentFields, setFocus])

  const handleCreateFields = useCallback(() => {
    setShowCreateFieldsModal(false)
    setFocus({ type: 'summary' })
    if (formId) {
      window.open(`/admin/form/${formId}`, '_blank')
    }
  }, [setFocus, formId])

  const handleAddNewRespondent = useCallback(() => {
    setFocus({ type: 'new_respondent' })
  }, [setFocus])

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
        >
          Add people
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        <Text textStyle="body-2" color="secondary.400" mb="1.5rem">
          Add people to fill in fields or receive notifications
        </Text>

        {/* Respondent pool cards (exclude form_link - shown on Step 1 automatically) */}
        <Stack spacing="0.5rem">
          {respondents
            .filter((r) => r.type !== 'form_link')
            .map((r) => {
              const isDeleting = r.id === deletingRespondentId
              return (
                <Box
                  key={r.id}
                  overflow="hidden"
                  maxH={isDeleting ? 0 : '10rem'}
                  opacity={isDeleting ? 0 : 1}
                  transform={isDeleting ? 'scale(0.95)' : 'scale(1)'}
                  transition="max-height 0.3s ease, opacity 0.2s ease, transform 0.2s ease"
                >
                  <RespondentCard
                    respondent={r}
                    onEdit={
                      r.isCustom
                        ? () =>
                            setFocus({
                              type: 'edit_respondent',
                              respondentId: r.id,
                            })
                        : r.type === 'collaborator'
                          ? () => {
                              const collaboratorsButton =
                                document.querySelector(
                                  '[aria-label="Manage collaborators"]',
                                ) as HTMLButtonElement | null
                              collaboratorsButton?.click()
                            }
                          : undefined
                    }
                  />
                </Box>
              )
            })}
        </Stack>

        {/* Add new respondent */}
        <Button
          variant="clear"
          colorScheme="primary"
          leftIcon={<Icon as={BiPlus} fontSize="1.25rem" />}
          mt="0.5rem"
          onClick={handleAddNewRespondent}
        >
          Add a new person
        </Button>

        {/* CTA - wizard navigation */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" py="1rem" gap="0.5rem">
          <Button
            variant="clear"
            colorScheme="primary"
            onClick={handlePrevPhase}
          >
            Previous
          </Button>
          <Button variant="outline" colorScheme="primary" onClick={handleNext}>
            Next
          </Button>
        </Flex>
      </Box>

      {/* Create fields modal */}
      <Modal
        isOpen={showCreateFieldsModal}
        onClose={() => setShowCreateFieldsModal(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader color="secondary.700" pr="4rem">
            Create fields first
          </ModalHeader>
          <ModalBody color="secondary.500" textStyle="body-2">
            You haven&apos;t created any fields yet. Create fields in the form
            builder before assigning them to workflow steps.
          </ModalBody>
          <ModalFooter>
            <Stack
              spacing="1rem"
              w="100%"
              direction={{ base: 'column', md: 'row-reverse' }}
            >
              <Button colorScheme="primary" onClick={handleCreateFields}>
                Create fields
              </Button>
              <Button
                colorScheme="secondary"
                variant="clear"
                onClick={() => setShowCreateFieldsModal(false)}
              >
                Go back
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}
