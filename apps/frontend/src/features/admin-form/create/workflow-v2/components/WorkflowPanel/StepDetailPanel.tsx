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
  Radio,
  RadioGroup,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'

import Button from '~components/Button'
import { SingleSelect } from '~components/Dropdown'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useDesignColorTheme } from '~features/admin-form/create/builder-and-design/utils/useDesignColorTheme'
import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import type { RespondentType, StepType, WorkflowStep } from '../../types'
import {
  fieldsSelector,
  respondentsSelector,
  setFocusSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

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

  const [editName, setEditName] = useState(step.name)
  const [emailsText, setEmailsText] = useState('')

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
          <Text textStyle="subhead-1" color="secondary.500" mb="0.75rem">
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
          <Text textStyle="subhead-1" color="secondary.500" mb="0.75rem">
            People involved
          </Text>

          {step.order === 0 ? (
            <Flex align="center" gap="0.5rem">
              <Icon as={BiEnvelope} fontSize="1rem" color="secondary.400" />
              <Text textStyle="body-1" color="secondary.500">
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
                    <Text textStyle="body-1" color="secondary.500">
                      Email field
                    </Text>
                  </Radio>
                  {currentRespondentType === 'email_field' && (
                    <Box pl="1.75rem" pt="0.5rem">
                      <SingleSelect
                        name="emailFieldSelect"
                        isClearable={false}
                        placeholder="Select an email field"
                        items={emailFieldItems}
                        value={currentLinkedFieldId ?? ''}
                        onChange={handleFieldSelect}
                      />
                    </Box>
                  )}
                </Box>

                <Box>
                  <Radio
                    value="specific_email"
                    colorScheme={checkboxColorScheme}
                  >
                    <Text textStyle="body-1" color="secondary.500">
                      Specific email(s)
                    </Text>
                  </Radio>
                  {currentRespondentType === 'specific_email' && (
                    <Box pl="1.75rem" pt="0.5rem">
                      <Textarea
                        value={emailsText}
                        onChange={(e) => setEmailsText(e.target.value)}
                        onBlur={handleEmailsBlur}
                        placeholder="e.g. bigboss@open.gov.sg, admin@open.gov.sg"
                        rows={3}
                      />
                    </Box>
                  )}
                </Box>

                <Box>
                  <Radio
                    value="dropdown_field"
                    colorScheme={checkboxColorScheme}
                  >
                    <Text textStyle="body-1" color="secondary.500">
                      Dropdown field
                    </Text>
                  </Radio>
                  {currentRespondentType === 'dropdown_field' && (
                    <Box pl="1.75rem" pt="0.5rem">
                      <SingleSelect
                        name="dropdownFieldSelect"
                        isClearable={false}
                        placeholder="Select a dropdown field"
                        items={dropdownFieldItems}
                        value={currentLinkedFieldId ?? ''}
                        onChange={handleFieldSelect}
                      />
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
          <Text textStyle="subhead-1" color="secondary.500" mb="0.75rem">
            What they do
          </Text>
          <RadioGroup
            value={step.type}
            onChange={(val) => setStepType(step.id, val as StepType)}
          >
            <Stack spacing="0.75rem">
              <Box>
                <Radio value="collect" colorScheme={checkboxColorScheme}>
                  <Stack spacing="0.25rem">
                    <Text textStyle="body-1" color="secondary.500">
                      Fill up a response
                    </Text>
                    <Text textStyle="caption-1" color="secondary.400">
                      This person fills in their selected fields.
                    </Text>
                  </Stack>
                </Radio>
              </Box>
              <Box>
                <Radio value="review" colorScheme={checkboxColorScheme}>
                  <Stack spacing="0.25rem">
                    <Text textStyle="body-1" color="secondary.500">
                      Fill up a response and approve
                    </Text>
                    <Text textStyle="caption-1" color="secondary.400">
                      This person fills in their selected fields and makes an
                      approval decision. If they select No, the workflow will
                      stop.
                    </Text>
                  </Stack>
                </Radio>
                {step.type === 'review' && (
                  <Box ml="1.75rem" mt="0.75rem">
                    <Text
                      textStyle="subhead-2"
                      color="secondary.500"
                      mb="0.5rem"
                    >
                      Approval field (Yes/No)
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
                      <Text textStyle="caption-1" color="secondary.400">
                        No Yes/No fields in this form yet. Create one in the
                        Fields tab.
                      </Text>
                    )}
                  </Box>
                )}
              </Box>
            </Stack>
          </RadioGroup>
        </Box>

        <Divider />

        {/* Section 4: Fields in this step */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Flex justify="space-between" align="center" mb="0.75rem">
            <Text textStyle="subhead-1" color="secondary.500">
              Fields in this step
            </Text>
            <Text textStyle="body-2" color="secondary.400">
              {assignedCount} of {totalCount}
            </Text>
          </Flex>

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
                  <Text textStyle="body-1" color="secondary.500">
                    {field.number}. {field.name}
                  </Text>
                </Checkbox>
              )
            })}
          </Stack>
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
              removeStep(step.id)
              handleBack()
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
    </Flex>
  )
}
