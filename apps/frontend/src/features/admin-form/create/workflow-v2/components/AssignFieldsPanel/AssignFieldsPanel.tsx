import { useCallback, useEffect } from 'react'
import { BiBox, BiLeftArrowAlt, BiLinkExternal } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'

import { useAdminForm } from '~features/admin-form/common/queries'
import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import type { FieldType, FormField } from '../../types'
import {
  fieldsSelector,
  setFocusSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { FieldCard } from './FieldCard'

/**
 * Map backend BasicField values to our local FieldType.
 * Unmapped types default to 'short_text'.
 */
const BASIC_FIELD_TO_FIELD_TYPE: Record<string, FieldType> = {
  textfield: 'short_text',
  email: 'email',
  dropdown: 'dropdown',
  date: 'date',
  textarea: 'long_text',
  yes_no: 'yes_no',
}

export const AssignFieldsPanel = (): JSX.Element => {
  const fields = useWorkflowBuilderStore(fieldsSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const syncFields = useWorkflowBuilderStore((s) => s.syncFields)
  const assignAllFields = useWorkflowBuilderStore((s) => s.assignAllFields)
  const { formId } = useParams()
  const { data: adminForm } = useAdminForm()

  // Sync real form fields from API into Zustand store
  useEffect(() => {
    if (!adminForm?.form_fields) return
    const mapped: FormField[] = adminForm.form_fields.map((f, i) => ({
      id: f._id,
      name: f.title,
      fieldType: BASIC_FIELD_TO_FIELD_TYPE[f.fieldType] ?? 'short_text',
      number: i + 1,
    }))
    syncFields(mapped)
  }, [adminForm?.form_fields, syncFields])

  // Auto-assign all fields to Step 1 on first entry
  useEffect(() => {
    if (fields.length === 0) return
    const step1 = steps.find((s) => s.order === 0)
    if (step1 && step1.fieldIds.length === 0) {
      assignAllFields(step1.id)
    }
  }, [fields, steps, assignAllFields])

  const handleBack = useCallback(() => {
    setFocus({ type: 'summary' })
  }, [setFocus])

  const handleAddNewField = useCallback(() => {
    if (formId) {
      window.location.href = `/admin/form/${formId}`
    }
  }, [formId])

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
          Assign fields
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        {fields.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            pt="2rem"
            pb="1rem"
            gap="0.5rem"
          >
            <Icon
              as={BiBox}
              fontSize="2rem"
              color="secondary.300"
              mb="0.25rem"
            />
            <Text
              textStyle="subhead-1"
              color="secondary.500"
              textAlign="center"
            >
              No fields yet
            </Text>
            <Button
              colorScheme="primary"
              rightIcon={<Icon as={BiLinkExternal} fontSize="1.125rem" />}
              onClick={handleAddNewField}
            >
              Add new field in form builder
            </Button>
          </Flex>
        ) : (
          <>
            <Stack spacing="0.5rem">
              {fields.map((f) => (
                <FieldCard
                  key={f.id}
                  field={f}
                  onEdit={() =>
                    setFocus({ type: 'field_assign', fieldId: f.id })
                  }
                />
              ))}
            </Stack>

            {/* Add new field */}
            <Button
              variant="clear"
              colorScheme="primary"
              rightIcon={<Icon as={BiLinkExternal} fontSize="1.125rem" />}
              mt="0.5rem"
              onClick={handleAddNewField}
            >
              Add new field in form builder
            </Button>
          </>
        )}

        {/* CTA */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" py="1rem">
          <Button variant="outline" colorScheme="primary" onClick={handleBack}>
            Done assigning fields
          </Button>
        </Flex>
      </Box>
    </Flex>
  )
}
