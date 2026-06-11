import { useCallback, useMemo, useState } from 'react'
import { BiEnvelope, BiLeftArrowAlt, BiTrash } from 'react-icons/bi'
import {
  Box,
  Checkbox,
  Divider,
  Flex,
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
  useDisclosure,
} from '@chakra-ui/react'

import Button from '~components/Button'
import { SingleSelect } from '~components/Dropdown'
import { ModalCloseButton } from '~components/Modal'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useDesignColorTheme } from '~features/admin-form/create/builder-and-design/utils/useDesignColorTheme'
import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'
import { useCreatePageSidebar } from '~features/admin-form/create/common/CreatePageSidebarContext'

import type { RespondentType, StepType, WorkflowStep } from '../../types'
import {
  fieldsSelector,
  respondentsSelector,
  setFocusSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'
import { OptionEmailMappingModal } from '../AddRespondentsPanel/OptionEmailMappingModal'

type StepDetailPanelProps = {
  step: WorkflowStep
  stepIndex: number
  colourTheme: string
}

export const StepDetailPanel = ({
  step,
  stepIndex,
  colourTheme,
}: StepDetailPanelProps): JSX.Element => {
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const setStepType = useWorkflowBuilderStore((s) => s.setStepType)
  const toggleFieldAssignment = useWorkflowBuilderStore(
    (s) => s.toggleFieldAssignment,
  )
  const renameStep = useWorkflowBuilderStore((s) => s.renameStep)
  const removeStep = useWorkflowBuilderStore((s) => s.removeStep)
  const setApprovalDecisionField = useWorkflowBuilderStore(
    (s) => s.setApprovalDecisionField,
  )
  const assignField = useWorkflowBuilderStore((s) => s.assignField)
  const assignRespondent = useWorkflowBuilderStore((s) => s.assignRespondent)
  const unassignRespondent = useWorkflowBuilderStore(
    (s) => s.unassignRespondent,
  )
  const addRespondent = useWorkflowBuilderStore((s) => s.addRespondent)
  const updateRespondent = useWorkflowBuilderStore((s) => s.updateRespondent)

  const { data: form } = useAdminForm()
  const { handleBuilderClick } = useCreatePageSidebar()

  const [editName, setEditName] = useState(step.name)
  const [emailsText, setEmailsText] = useState('')
  const mappingModal = useDisclosure()
  const deleteModal = useDisclosure()

  // Step is "dirty" if any configuration has been done
  const isStepDirty = useMemo(() => {
    if (step.respondentIds.length > 0) return true
    if (step.fieldIds.length > 0) return true
    if (step.isCustomName) return true
    if (step.type !== 'collect') return true
    return false
  }, [step.respondentIds, step.fieldIds, step.isCustomName, step.type])

  const colorTheme = useDesignColorTheme()
  const checkboxColorScheme = colorTheme ? `theme-${colorTheme}` : 'theme-blue'

  const assignedCount = step.fieldIds.length
  const totalCount = fields.length

  const stepRespondents = useMemo(() => {
    return respondents.filter((r) => step.respondentIds.includes(r.id))
  }, [respondents, step.respondentIds])

  const currentRespondentType = useMemo(() => {
    if (step.order === 0) return 'form_link'
    if (stepRespondents.length > 0) return stepRespondents[0].type
    return 'email_field'
  }, [step.order, stepRespondents])

  // Current respondent's linked field ID (for email_field and dropdown_field)
  const currentLinkedFieldId = useMemo(() => {
    if (stepRespondents.length > 0) return stepRespondents[0].linkedFieldId
    return undefined
  }, [stepRespondents])

  // Initialise email text from respondent data
  useState(() => {
    if (
      currentRespondentType === 'specific_email' &&
      stepRespondents[0]?.email
    ) {
      setEmailsText(stepRespondents[0].email)
    }
  })

  // Email fields in form (for email_field respondent type)
  const emailFieldItems = useMemo(() => {
    if (!form?.form_fields) return []
    return form.form_fields
      .filter((f) => f.fieldType === 'email')
      .map((f, _i) => ({
        value: f._id,
        label: f.title,
      }))
  }, [form?.form_fields])

  // Dropdown fields in form (for dropdown_field respondent type)
  const dropdownFieldItems = useMemo(() => {
    if (!form?.form_fields) return []
    return form.form_fields
      .filter((f) => f.fieldType === 'dropdown')
      .map((f) => ({
        value: f._id,
        label: f.title,
      }))
  }, [form?.form_fields])

  // Yes/No fields in form (for approval selector)
  const yesNoFields = useMemo(() => {
    if (!form?.form_fields) return []
    return form.form_fields
      .filter((f) => f.fieldType === 'yes_no')
      .map((f, _i) => ({
        value: f._id,
        label: f.title,
      }))
  }, [form?.form_fields])

  // Options for the currently selected dropdown field (for email mapping)
  const selectedDropdownOptions = useMemo(() => {
    if (!currentLinkedFieldId || !form?.form_fields) return []
    const field = form.form_fields.find((f) => f._id === currentLinkedFieldId)
    if (!field || field.fieldType !== 'dropdown') return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((field as any).fieldOptions as string[]) ?? []
  }, [currentLinkedFieldId, form?.form_fields])

  // Current mapping from respondent
  const currentMapping = useMemo(() => {
    if (stepRespondents.length === 0) return undefined
    return stepRespondents[0].optionsToRecipientsMap
  }, [stepRespondents])

  const mappedCount = useMemo(() => {
    if (!currentMapping) return 0
    const values = Object.values(currentMapping) as string[][]
    return values.filter((emails) => emails.length > 0).length
  }, [currentMapping])

  const handleMappingSave = useCallback(
    (mapping: Record<string, string[]>) => {
      if (stepRespondents.length === 0) return
      updateRespondent(stepRespondents[0].id, {
        optionsToRecipientsMap: mapping,
      })
    },
    [stepRespondents, updateRespondent],
  )

  const handleRespondentTypeChange = useCallback(
    (newType: string) => {
      // Remove existing respondents from this step
      for (const rid of step.respondentIds) {
        unassignRespondent(step.id, rid)
      }
      // Find or create a respondent of the new type
      const allRespondents = useWorkflowBuilderStore.getState().respondents
      let respondent = allRespondents.find((r) => r.type === newType)
      if (!respondent) {
        const name =
          newType === 'specific_email'
            ? 'Specific email(s)'
            : newType === 'email_field'
              ? 'Email field'
              : 'Dropdown field'
        addRespondent({
          type: newType as RespondentType,
          name,
          isCustom: true,
        })
        const updated = useWorkflowBuilderStore.getState().respondents
        respondent = updated[updated.length - 1]
      }
      if (respondent) {
        assignRespondent(step.id, respondent.id)
      }
    },
    [
      step.id,
      step.respondentIds,
      unassignRespondent,
      addRespondent,
      assignRespondent,
    ],
  )

  const handleFieldSelect = useCallback(
    (fieldId: string | null) => {
      if (!fieldId || stepRespondents.length === 0) return
      updateRespondent(stepRespondents[0].id, { linkedFieldId: fieldId })
    },
    [stepRespondents, updateRespondent],
  )

  const handleEmailsBlur = useCallback(() => {
    if (stepRespondents.length === 0) return
    const trimmed = emailsText.trim()
    updateRespondent(stepRespondents[0].id, { email: trimmed })
  }, [stepRespondents, emailsText, updateRespondent])

  const handleApprovalFieldChange = useCallback(
    (fieldId: string | null) => {
      if (!fieldId) return
      setApprovalDecisionField(step.id, fieldId)
      assignField(step.id, fieldId)
    },
    [step.id, setApprovalDecisionField, assignField],
  )

  const handleBack = useCallback(() => {
    setFocus({ type: 'default' })
  }, [setFocus])

  const handleNameBlur = useCallback(() => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== step.name) {
      renameStep(step.id, trimmed)
    } else {
      setEditName(step.name)
    }
  }, [editName, step.name, step.id, renameStep])

  return (
    <Flex h="100%" flexDir="column">
      {/* Sticky header - matches field editor pattern */}
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

      {/* Scrollable content area */}
      <Box flex={1} overflow="auto">
        {/* Section 1: Step name */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Text textStyle="subhead-1" color="secondary.700" mb="0.75rem">
            Step name
          </Text>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleNameBlur()
                ;(e.target as HTMLInputElement).blur()
              }
            }}
          />
        </Box>

        <Divider />

        {/* Section 2: People involved */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Text textStyle="subhead-1" color="secondary.700" mb="0.75rem">
            People who are filling up this step
          </Text>

          {step.order === 0 ? (
            <Flex align="center" gap="0.5rem">
              <Icon as={BiEnvelope} fontSize="1rem" color="secondary.400" />
              <Text textStyle="body-1" color="secondary.700">
                Anyone you share this form link with
              </Text>
            </Flex>
          ) : (
            <RadioGroup
              value={currentRespondentType}
              onChange={handleRespondentTypeChange}
            >
              <Stack spacing="0.75rem">
                <Box>
                  <Radio value="email_field" colorScheme={checkboxColorScheme}>
                    <Text textStyle="body-1" color="secondary.700">
                      Emails entered into an email field
                    </Text>
                  </Radio>
                  {currentRespondentType === 'email_field' && (
                    <Box ml="2.75rem" pt="0.5rem">
                      {emailFieldItems.length > 0 ? (
                        <SingleSelect
                          name="emailFieldSelect"
                          isClearable={false}
                          placeholder="Select an email field"
                          items={emailFieldItems}
                          value={currentLinkedFieldId ?? ''}
                          onChange={handleFieldSelect}
                        />
                      ) : (
                        <Stack spacing="0.5rem">
                          <Text textStyle="body-2" color="secondary.400">
                            You don't have any email fields.
                          </Text>
                          <Button
                            variant="outline"
                            colorScheme="primary"
                            size="sm"
                            onClick={() =>
                              setFocus({
                                type: 'create_field',
                                fieldType: 'email',
                                fromStepId: step.id,
                              })
                            }
                          >
                            Create email field
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  )}
                </Box>

                <Box>
                  <Radio
                    value="specific_email"
                    colorScheme={checkboxColorScheme}
                  >
                    <Text textStyle="body-1" color="secondary.700">
                      Specific emails that you choose
                    </Text>
                  </Radio>
                  {currentRespondentType === 'specific_email' && (
                    <Box ml="2.75rem" pt="0.5rem">
                      <Input
                        value={emailsText}
                        onChange={(e) => setEmailsText(e.target.value)}
                        onBlur={handleEmailsBlur}
                        placeholder="Enter email addresses"
                      />
                    </Box>
                  )}
                </Box>

                <Box>
                  <Radio
                    value="dropdown_field"
                    colorScheme={checkboxColorScheme}
                  >
                    <Text textStyle="body-1" color="secondary.700">
                      Emails mapped to a dropdown field
                    </Text>
                  </Radio>
                  {currentRespondentType === 'dropdown_field' && (
                    <Box ml="2.75rem" pt="0.5rem">
                      {dropdownFieldItems.length > 0 ? (
                        <>
                          <SingleSelect
                            name="dropdownFieldSelect"
                            isClearable={false}
                            placeholder="Select a dropdown field"
                            items={dropdownFieldItems}
                            value={currentLinkedFieldId ?? ''}
                            onChange={handleFieldSelect}
                          />
                          {currentLinkedFieldId &&
                            selectedDropdownOptions.length > 0 && (
                              <Button
                                variant="outline"
                                colorScheme="primary"
                                size="sm"
                                w="100%"
                                mt="0.5rem"
                                onClick={mappingModal.onOpen}
                              >
                                {mappedCount > 0
                                  ? `${mappedCount} option${mappedCount === 1 ? '' : 's'} mapped`
                                  : 'Map emails to options'}
                              </Button>
                            )}
                        </>
                      ) : (
                        <Stack spacing="0.5rem">
                          <Text textStyle="body-2" color="secondary.400">
                            You don't have any dropdown fields.
                          </Text>
                          <Button
                            variant="outline"
                            colorScheme="primary"
                            size="sm"
                            onClick={() =>
                              setFocus({
                                type: 'create_field',
                                fieldType: 'dropdown',
                                fromStepId: step.id,
                              })
                            }
                          >
                            Create dropdown field
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  )}
                </Box>
              </Stack>
            </RadioGroup>
          )}
        </Box>

        <Divider />

        {/* Section 3: What they do (step type) */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Text textStyle="subhead-1" color="secondary.700" mb="0.75rem">
            What they do
          </Text>
          {step.order === 0 ? (
            <Text textStyle="body-1" color="secondary.700">
              Fill up a response
            </Text>
          ) : (
            <RadioGroup
              value={step.type}
              onChange={(val) => setStepType(step.id, val as StepType)}
            >
              <Stack spacing="0.75rem">
                <Box>
                  <Radio value="collect" colorScheme={checkboxColorScheme}>
                    <Stack spacing="0.25rem">
                      <Text textStyle="body-1" color="secondary.700">
                        Fill up fields
                      </Text>
                      <Text textStyle="body-2" color="secondary.400">
                        This person fills in the fields assigned to them.
                      </Text>
                    </Stack>
                  </Radio>
                </Box>
                <Box>
                  <Radio value="review" colorScheme={checkboxColorScheme}>
                    <Stack spacing="0.25rem">
                      <Text textStyle="body-1" color="secondary.700">
                        Fill up fields and approve
                      </Text>
                      <Text textStyle="body-2" color="secondary.400">
                        This person fills in their fields, then approves or
                        rejects. If rejected, the workflow stops.
                      </Text>
                    </Stack>
                  </Radio>
                  {step.type === 'review' && (
                    <Box ml="2.75rem" mt="0.75rem">
                      <Text
                        textStyle="subhead-2"
                        color="secondary.700"
                        mb="0.5rem"
                      >
                        Approval field
                      </Text>
                      {yesNoFields.length > 0 ? (
                        <SingleSelect
                          name="approvalFieldSelect"
                          isClearable={false}
                          placeholder="Select a Yes/No field"
                          items={yesNoFields}
                          value={step.approvalDecisionFieldId ?? ''}
                          onChange={handleApprovalFieldChange}
                        />
                      ) : (
                        <Stack spacing="0.5rem">
                          <Text textStyle="body-2" color="secondary.400">
                            You don't have a Yes/No field for approvers to use.
                          </Text>
                          <Button
                            variant="outline"
                            colorScheme="primary"
                            size="sm"
                            onClick={() =>
                              setFocus({
                                type: 'create_field',
                                fieldType: 'yes_no',
                                fromStepId: step.id,
                              })
                            }
                          >
                            Create Yes/No field
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  )}
                </Box>
              </Stack>
            </RadioGroup>
          )}
        </Box>

        <Divider />

        {/* Section 4: Fields in this step */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Flex justify="space-between" align="center" mb="0.75rem">
            <Text textStyle="subhead-1" color="secondary.700">
              Choose which fields to fill in this step
            </Text>
            <Text textStyle="body-2" color="secondary.400">
              {assignedCount} of {totalCount}
            </Text>
          </Flex>

          {fields.length > 0 ? (
            <Stack spacing="0.5rem">
              {fields.map((field) => {
                const isAssigned = step.fieldIds.includes(field.id)
                return (
                  <Checkbox
                    key={field.id}
                    isChecked={isAssigned}
                    onChange={() => toggleFieldAssignment(step.id, field.id)}
                    colorScheme={checkboxColorScheme}
                    spacing="0.75rem"
                  >
                    <Text textStyle="body-1" color="secondary.700">
                      {field.number}. {field.name}
                    </Text>
                  </Checkbox>
                )
              })}
            </Stack>
          ) : (
            <Text textStyle="body-2" color="secondary.400">
              No fields on your form yet.{' '}
              <Text
                as="span"
                color="primary.500"
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
                onClick={() => handleBuilderClick(false)}
              >
                Add fields from the Fields tab
              </Text>
            </Text>
          )}
        </Box>
      </Box>

      {/* Sticky footer: delete (left) + Cancel / Done (right) */}
      <Divider />
      <Flex
        justify="space-between"
        align="center"
        px="1.5rem"
        py="1rem"
        bg="white"
      >
        {step.order > 0 ? (
          <IconButton
            aria-label="Delete step"
            icon={<BiTrash fontSize="1.25rem" />}
            variant="clear"
            colorScheme="danger"
            size="sm"
            onClick={() => {
              if (isStepDirty) {
                deleteModal.onOpen()
              } else {
                removeStep(step.id)
                handleBack()
              }
            }}
          />
        ) : (
          <Box />
        )}
        <Flex gap="0.75rem">
          <Button variant="clear" colorScheme="secondary" onClick={handleBack}>
            Cancel
          </Button>
          <Button colorScheme="primary" onClick={handleBack}>
            Done
          </Button>
        </Flex>
      </Flex>

      {/* Dropdown email mapping modal */}
      <OptionEmailMappingModal
        isOpen={mappingModal.isOpen}
        onClose={mappingModal.onClose}
        options={selectedDropdownOptions}
        initialMapping={currentMapping}
        onSave={handleMappingSave}
      />

      {/* Delete step confirmation modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader color="secondary.700" pr="4rem">
            Delete &ldquo;{step.name}&rdquo;?
          </ModalHeader>
          <ModalBody>
            <Text textStyle="body-2" color="secondary.500">
              This step has been configured. Are you sure you want to delete it?
              This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Stack
              spacing="1rem"
              w="100%"
              direction={{ base: 'column', md: 'row-reverse' }}
            >
              <Button
                colorScheme="danger"
                onClick={() => {
                  removeStep(step.id)
                  handleBack()
                }}
                autoFocus
              >
                Yes, delete step
              </Button>
              <Button
                variant="clear"
                colorScheme="secondary"
                onClick={deleteModal.onClose}
              >
                No, return to editing
              </Button>
            </Stack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}
