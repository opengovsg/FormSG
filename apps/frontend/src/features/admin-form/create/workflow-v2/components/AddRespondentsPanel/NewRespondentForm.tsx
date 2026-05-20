import { useCallback, useEffect, useMemo, useState } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'

import { SingleSelect } from '~components/Dropdown'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import type { RespondentType } from '../../types'
import {
  fieldsSelector,
  focusStateSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { OptionEmailMappingModal } from './OptionEmailMappingModal'

const MAX_NAME_LENGTH = 50

export const NewRespondentForm = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)
  const addRespondent = useWorkflowBuilderStore((s) => s.addRespondent)
  const assignRespondent = useWorkflowBuilderStore((s) => s.assignRespondent)
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const setPendingFieldSelection = useWorkflowBuilderStore(
    (s) => s.setPendingFieldSelection,
  )

  const fromStepId =
    focusState.type === 'new_respondent' ? focusState.fromStepId : undefined

  const [name, setName] = useState('')
  const [respondentType, setRespondentType] =
    useState<RespondentType>('specific_email')
  const [emails, setEmails] = useState('')
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [optionsToRecipientsMap, setOptionsToRecipientsMap] = useState<
    Record<string, string[]> | undefined
  >(undefined)
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false)

  const emailFields = useMemo(
    () => fields.filter((f) => f.fieldType === 'email'),
    [fields],
  )
  const dropdownFields = useMemo(
    () => fields.filter((f) => f.fieldType === 'dropdown'),
    [fields],
  )

  // Auto-select field when returning from field creation
  useEffect(() => {
    const pending = useWorkflowBuilderStore.getState().pendingFieldSelection
    if (pending) {
      setSelectedFieldId(pending)
      const field = fields.find((f) => f.id === pending)
      if (field?.fieldType === 'email') setRespondentType('email_field')
      if (field?.fieldType === 'dropdown') setRespondentType('dropdown_field')
      setPendingFieldSelection(null)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedDropdownField = useMemo(
    () =>
      respondentType === 'dropdown_field'
        ? fields.find((f) => f.id === selectedFieldId)
        : undefined,
    [respondentType, selectedFieldId, fields],
  )

  const navigateBack = useCallback(() => {
    if (fromStepId) {
      setFocus({
        type: 'step_focus',
        phase: 'add_respondents',
        stepId: fromStepId,
      })
    } else {
      setFocus({ type: 'phase', phase: 'add_respondents' })
    }
  }, [setFocus, fromStepId])

  const handleSave = useCallback(() => {
    if (!name.trim()) return

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

    addRespondent({
      name: name.trim(),
      type: respondentType,
      description,
      email: respondentType === 'specific_email' ? emails.trim() : undefined,
      linkedFieldId:
        respondentType === 'email_field' || respondentType === 'dropdown_field'
          ? (selectedFieldId ?? undefined)
          : undefined,
      optionsToRecipientsMap:
        respondentType === 'dropdown_field'
          ? optionsToRecipientsMap
          : undefined,
      isCustom: true,
    })

    // Auto-assign to step if created from step-focus
    if (fromStepId) {
      const store = useWorkflowBuilderStore.getState()
      const latestRespondent = store.respondents[store.respondents.length - 1]
      if (latestRespondent) {
        assignRespondent(fromStepId, latestRespondent.id)
      }
    }

    navigateBack()
  }, [
    name,
    respondentType,
    emails,
    selectedFieldId,
    optionsToRecipientsMap,
    fields,
    fromStepId,
    addRespondent,
    assignRespondent,
    navigateBack,
  ])

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
          Add a new respondent
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
              placeholder="e.g. Department admins"
              autoFocus
            />
            <Text textStyle="caption-1" color="secondary.400" mt="0.25rem">
              ({name.length}/{MAX_NAME_LENGTH})
            </Text>
          </FormControl>
        </Box>

        <Divider />

        {/* Select a respondent type */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <FormControl>
            <FormLabel textStyle="subhead-1" color="secondary.500">
              Select a respondent
            </FormLabel>
            <RadioGroup
              value={respondentType}
              onChange={(val) => {
                setRespondentType(val as RespondentType)
                setSelectedFieldId(null)
                setOptionsToRecipientsMap(undefined)
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
                        name="emailFieldSelect"
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
                              fromStepId,
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
                        fontSize="sm"
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
                        name="dropdownFieldSelect"
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
                              fromStepId,
                            })
                          } else {
                            setSelectedFieldId(value || null)
                            setOptionsToRecipientsMap(undefined)
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
                          {optionsToRecipientsMap
                            ? `${
                                Object.values(optionsToRecipientsMap).filter(
                                  (e) => e.length > 0,
                                ).length
                              } option${
                                Object.values(optionsToRecipientsMap).filter(
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
        <Flex justify="flex-end" gap="0.75rem" px="1.5rem" py="1rem">
          <Button variant="clear" onClick={navigateBack}>
            Cancel
          </Button>
          <Button
            colorScheme="primary"
            onClick={handleSave}
            isDisabled={!canSave}
          >
            Save respondent
          </Button>
        </Flex>
      </Box>

      {/* Option-email mapping modal for dropdown fields */}
      {selectedDropdownField?.options && (
        <OptionEmailMappingModal
          isOpen={isMappingModalOpen}
          onClose={() => setIsMappingModalOpen(false)}
          options={selectedDropdownField.options}
          initialMapping={optionsToRecipientsMap}
          onSave={setOptionsToRecipientsMap}
        />
      )}
    </Flex>
  )
}
