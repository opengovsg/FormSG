import { useCallback, useMemo, useState } from 'react'
import { BiLeftArrowAlt, BiTrash } from 'react-icons/bi'
import {
  Box,
  ButtonGroup,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'

import Button from '~components/Button'
import { SingleSelect } from '~components/Dropdown'
import { ModalCloseButton } from '~components/Modal'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import type { RespondentType } from '../../types'
import {
  fieldsSelector,
  focusStateSelector,
  respondentsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { OptionEmailMappingModal } from './OptionEmailMappingModal'

const MAX_NAME_LENGTH = 50

export const EditRespondentForm = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)
  const updateRespondent = useWorkflowBuilderStore((s) => s.updateRespondent)
  const removeRespondent = useWorkflowBuilderStore((s) => s.removeRespondent)

  const respondentId =
    focusState.type === 'edit_respondent' ? focusState.respondentId : ''

  const respondent = useMemo(
    () => respondents.find((r) => r.id === respondentId),
    [respondents, respondentId],
  )

  const emailFields = useMemo(
    () => fields.filter((f) => f.fieldType === 'email'),
    [fields],
  )
  const dropdownFields = useMemo(
    () => fields.filter((f) => f.fieldType === 'dropdown'),
    [fields],
  )

  const [name, setName] = useState(respondent?.name ?? '')
  const [respondentType, setRespondentType] = useState<RespondentType>(
    respondent?.type ?? 'specific_email',
  )
  const [emails, setEmails] = useState(respondent?.email ?? '')
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    respondent?.linkedFieldId ?? null,
  )
  const [editedMapping, setEditedMapping] = useState<
    Record<string, string[]> | undefined
  >(respondent?.optionsToRecipientsMap)
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const selectedDropdownField = useMemo(
    () =>
      respondentType === 'dropdown_field'
        ? fields.find((f) => f.id === selectedFieldId)
        : undefined,
    [respondentType, selectedFieldId, fields],
  )

  const navigateBack = useCallback(() => {
    setFocus({ type: 'phase', phase: 'add_respondents' })
  }, [setFocus])

  const handleSave = useCallback(() => {
    if (!name.trim() || !respondentId) return

    // Build description based on type
    let description: string | undefined
    if (respondentType === 'specific_email' && emails.trim()) {
      description = emails.trim()
    } else if (respondentType === 'email_field' && selectedFieldId) {
      const field = fields.find((f) => f.id === selectedFieldId)
      description = field
        ? `Emails filled into the ${field.number}. ${field.name} field`
        : undefined
    } else if (respondentType === 'dropdown_field' && selectedFieldId) {
      const field = fields.find((f) => f.id === selectedFieldId)
      description = field
        ? `Emails assigned to options in the ${field.number}. ${field.name} field`
        : undefined
    }

    updateRespondent(respondentId, {
      name: name.trim(),
      type: respondentType,
      description,
      email: respondentType === 'specific_email' ? emails.trim() : undefined,
      linkedFieldId:
        respondentType === 'email_field' || respondentType === 'dropdown_field'
          ? (selectedFieldId ?? undefined)
          : undefined,
      optionsToRecipientsMap:
        respondentType === 'dropdown_field' ? editedMapping : undefined,
    })

    navigateBack()
  }, [
    name,
    respondentType,
    emails,
    selectedFieldId,
    editedMapping,
    fields,
    respondentId,
    updateRespondent,
    navigateBack,
  ])

  if (!respondent) return <Box />

  const canSave =
    name.trim().length > 0 &&
    (respondentType === 'specific_email' ||
      ((respondentType === 'email_field' ||
        respondentType === 'dropdown_field') &&
        selectedFieldId !== null))

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
          aria-label="Back"
          icon={<BiLeftArrowAlt fontSize="1.25rem" />}
          variant="clear"
          colorScheme="secondary"
          size="sm"
          h="1.5rem"
          w="1.5rem"
          onClick={navigateBack}
        />
        <Text
          textStyle="h4"
          as="h4"
          color="secondary.500"
          flex={1}
          textAlign="center"
        >
          Edit respondent
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto">
        {/* Respondent name */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <FormControl>
            <FormLabel textStyle="subhead-1" color="secondary.500">
              Respondent name
            </FormLabel>
            <Input
              value={name}
              onChange={(e) =>
                setName(e.target.value.slice(0, MAX_NAME_LENGTH))
              }
              autoFocus
            />
            <Text textStyle="caption-1" color="secondary.400" mt="0.25rem">
              ({name.length}/{MAX_NAME_LENGTH})
            </Text>
          </FormControl>
        </Box>

        <Divider />

        {/* Respondent type (editable) */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <FormControl>
            <FormLabel textStyle="subhead-1" color="secondary.500">
              Respondent type
            </FormLabel>
            <RadioGroup
              value={respondentType}
              onChange={(val) => {
                setRespondentType(val as RespondentType)
                setSelectedFieldId(null)
                setEditedMapping(undefined)
              }}
            >
              <Stack spacing="1rem">
                {/* Email field */}
                <Box>
                  <Radio value="email_field" colorScheme="primary">
                    <Text textStyle="body-1" color="secondary.500">
                      An email field from the form
                    </Text>
                  </Radio>
                  {respondentType === 'email_field' && (
                    <Box pl="1.75rem" pt="0.75rem">
                      <SingleSelect
                        name="editEmailFieldSelect"
                        isClearable={false}
                        placeholder="Select an email field"
                        items={[
                          ...emailFields.map((f) => ({
                            value: f.id,
                            label: f.name,
                          })),
                          {
                            value: '__create_email__',
                            label: '+ Create email field',
                          },
                        ]}
                        value={selectedFieldId ?? ''}
                        onChange={(value) => {
                          if (value === '__create_email__') {
                            setFocus({
                              type: 'create_field',
                              fieldType: 'email',
                            })
                          } else {
                            setSelectedFieldId(value || null)
                          }
                        }}
                      />
                    </Box>
                  )}
                </Box>

                {/* Specific emails */}
                <Box>
                  <Radio value="specific_email" colorScheme="primary">
                    <Text textStyle="body-1" color="secondary.500">
                      Specific email(s)
                    </Text>
                  </Radio>
                  {respondentType === 'specific_email' && (
                    <Box pl="1.75rem" pt="0.75rem">
                      <Textarea
                        value={emails}
                        onChange={(e) => setEmails(e.target.value)}
                        placeholder="e.g. bigboss@open.gov.sg, admin@open.gov.sg"
                        rows={3}
                      />
                    </Box>
                  )}
                </Box>

                {/* Dropdown field */}
                <Box>
                  <Radio value="dropdown_field" colorScheme="primary">
                    <Text textStyle="body-1" color="secondary.500">
                      Emails assigned to options in a dropdown field
                    </Text>
                  </Radio>
                  {respondentType === 'dropdown_field' && (
                    <Box pl="1.75rem" pt="0.75rem">
                      <SingleSelect
                        name="editDropdownFieldSelect"
                        isClearable={false}
                        placeholder="Select a dropdown field"
                        items={[
                          ...dropdownFields.map((f) => ({
                            value: f.id,
                            label: f.name,
                          })),
                          {
                            value: '__create_dropdown__',
                            label: '+ Create dropdown field',
                          },
                        ]}
                        value={selectedFieldId ?? ''}
                        onChange={(value) => {
                          if (value === '__create_dropdown__') {
                            setFocus({
                              type: 'create_field',
                              fieldType: 'dropdown',
                            })
                          } else {
                            setSelectedFieldId(value || null)
                            setEditedMapping(undefined)
                          }
                        }}
                      />
                      {selectedDropdownField?.options && (
                        <Button
                          variant="outline"
                          colorScheme="primary"
                          size="sm"
                          mt="0.75rem"
                          onClick={() => setIsMappingModalOpen(true)}
                        >
                          {editedMapping
                            ? `${
                                Object.values(editedMapping).filter(
                                  (e) => e.length > 0,
                                ).length
                              } option${
                                Object.values(editedMapping).filter(
                                  (e) => e.length > 0,
                                ).length !== 1
                                  ? 's'
                                  : ''
                              } mapped - Edit`
                            : '+ Add emails to options'}
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              </Stack>
            </RadioGroup>
          </FormControl>
        </Box>

        {/* CTA */}
        <Divider />
        <Flex justify="space-between" align="center" px="1.5rem" py="1rem">
          <IconButton
            aria-label="Delete respondent"
            icon={<Icon as={BiTrash} fontSize="1.25rem" />}
            variant="clear"
            colorScheme="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
          />
          <Flex gap="0.75rem">
            <Button variant="clear" onClick={navigateBack}>
              Cancel
            </Button>
            <Button
              colorScheme="primary"
              onClick={handleSave}
              isDisabled={!canSave}
            >
              Save changes
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete respondent</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color="secondary.500">
              Are you sure you want to delete &quot;{respondent.name}&quot;?
              This will also remove them from any assigned steps and
              notifications.
            </Text>
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button
                variant="clear"
                colorScheme="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                colorScheme="danger"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  // Navigate back first so pool renders with card still present
                  navigateBack()
                  // Mark card as deleting (triggers fade-out in pool)
                  useWorkflowBuilderStore.setState({
                    deletingRespondentId: respondentId,
                  })
                  // Actually remove after animation
                  setTimeout(() => {
                    removeRespondent(respondentId)
                    useWorkflowBuilderStore.setState({
                      deletingRespondentId: null,
                    })
                  }, 300)
                }}
              >
                Delete
              </Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Option-email mapping modal for dropdown fields */}
      {selectedDropdownField?.options && (
        <OptionEmailMappingModal
          isOpen={isMappingModalOpen}
          onClose={() => setIsMappingModalOpen(false)}
          options={selectedDropdownField.options}
          initialMapping={editedMapping}
          onSave={setEditedMapping}
        />
      )}
    </Flex>
  )
}
