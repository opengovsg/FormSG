import { useCallback, useEffect } from 'react'
import { BiLeftArrowAlt, BiLinkExternal } from 'react-icons/bi'
import { BsFillPlusCircleFill } from 'react-icons/bs'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
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
      window.open(`/admin/form/${formId}`, '_blank')
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
        <Text textStyle="body-2" color="secondary.400" mb="1.5rem">
          Assign fields to steps so that they can be filled in or edited. These
          were fields you created in the form-builder.
        </Text>

        {fields.length === 0 ? (
          <Box
            borderRadius="8px"
            border="1px solid"
            borderColor="neutral.300"
            bg="white"
            p="1.5rem"
            textAlign="center"
          >
            <Text textStyle="body-2" color="secondary.400">
              No fields yet. Create fields in the form builder first.
            </Text>
          </Box>
        ) : (
          <Stack spacing="0.75rem">
            {fields.map((f) => (
              <FieldCard
                key={f.id}
                field={f}
                onEdit={() => {
                  if (formId) {
                    window.open(`/admin/form/${formId}`, '_blank')
                  }
                }}
              />
            ))}
          </Stack>
        )}

        {/* Add new field link */}
        <Box
          as="button"
          type="button"
          role="group"
          w="100%"
          textAlign="start"
          borderRadius="8px"
          border="1px solid"
          borderColor="neutral.300"
          bg="white"
          p="1rem"
          mt="0.75rem"
          cursor="pointer"
          _hover={{ borderColor: 'primary.500', bg: 'primary.100' }}
          transition="border-color 0.2s, background 0.2s"
          onClick={handleAddNewField}
        >
          <Flex align="center" gap="0.75rem">
            <Icon
              as={BsFillPlusCircleFill}
              fontSize="1.5rem"
              color="primary.500"
              flexShrink={0}
            />
            <Text textStyle="subhead-1" color="primary.500" flex={1}>
              Add new field
            </Text>
            <Box
              opacity={0}
              _groupHover={{ opacity: 1 }}
              transition="opacity 0.15s"
              display="flex"
              alignItems="center"
            >
              <Icon as={BiLinkExternal} fontSize="1rem" color="secondary.400" />
            </Box>
          </Flex>
        </Box>

        {/* CTA */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" py="1rem">
          <Button variant="clear" colorScheme="primary" onClick={handleBack}>
            Done assigning fields
          </Button>
        </Flex>
      </Box>
    </Flex>
  )
}
