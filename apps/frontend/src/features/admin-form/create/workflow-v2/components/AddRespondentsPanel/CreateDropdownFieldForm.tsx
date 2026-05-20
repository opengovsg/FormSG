import { useCallback, useState } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { useMutation, useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'
import Toggle from '~components/Toggle'

import { adminFormKeys } from '~features/admin-form/common/queries'
import { createSingleFormField } from '~features/admin-form/create/builder-and-design/UpdateFormFieldService'
import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import {
  focusStateSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

export const CreateDropdownFieldForm = (): JSX.Element => {
  const { formId } = useParams()
  const queryClient = useQueryClient()

  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)
  const addField = useWorkflowBuilderStore((s) => s.addField)
  const setPendingFieldSelection = useWorkflowBuilderStore(
    (s) => s.setPendingFieldSelection,
  )

  const fromStepId =
    focusState.type === 'create_field' ? focusState.fromStepId : undefined

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isRequired, setIsRequired] = useState(true)
  const [optionsText, setOptionsText] = useState('')

  const parsedOptions = optionsText
    .split('\n')
    .map((o) => o.trim())
    .filter(Boolean)

  // Real API mutation to create field in backend
  const createFieldMutation = useMutation(
    (body: Record<string, unknown>) =>
      createSingleFormField({
        formId: formId!,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        createFieldBody: body as any,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(adminFormKeys.id(formId!))
      },
    },
  )

  const navigateBack = useCallback(() => {
    setFocus({ type: 'new_respondent', fromStepId })
  }, [setFocus, fromStepId])

  const handleSave = useCallback(async () => {
    if (!name.trim() || parsedOptions.length === 0) return

    // Save to local Zustand store (for workflow dropdowns)
    addField({
      name: name.trim(),
      fieldType: 'dropdown',
      options: parsedOptions,
    })
    const store = useWorkflowBuilderStore.getState()
    const newField = store.fields[store.fields.length - 1]
    setPendingFieldSelection(newField.id)

    // Also create via API so it appears in the Build tab
    try {
      await createFieldMutation.mutateAsync({
        fieldType: 'dropdown',
        title: name.trim(),
        description: description.trim(),
        required: isRequired,
        disabled: false,
        fieldOptions: parsedOptions,
      })
    } catch {
      // API call failed - field still exists locally
    }

    navigateBack()
  }, [
    name,
    description,
    isRequired,
    parsedOptions,
    addField,
    setPendingFieldSelection,
    createFieldMutation,
    navigateBack,
  ])

  const canSave = name.trim().length > 0 && parsedOptions.length > 0

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
          Edit Dropdown
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto">
        {/* Info box */}
        <Box px="1.5rem" pt="1.5rem">
          <InlineMessage>
            This field will be placed at the end of your form. You can arrange
            and edit it again in the form-builder page.
          </InlineMessage>
        </Box>

        {/* Field Name */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <FormControl>
            <FormLabel textStyle="subhead-1" color="secondary.500">
              Field Name
            </FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Department"
              autoFocus
            />
          </FormControl>
        </Box>

        <Divider />

        {/* Description */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <FormControl>
            <Flex>
              <FormLabel textStyle="subhead-1" color="secondary.500">
                Description
              </FormLabel>
              <Text textStyle="body-2" color="secondary.400" ml="0.5rem">
                (optional)
              </Text>
            </Flex>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </FormControl>
        </Box>

        <Divider />

        {/* Required */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Toggle
            label="Required"
            isChecked={isRequired}
            onChange={() => setIsRequired(!isRequired)}
          />
        </Box>

        <Divider />

        {/* Options */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <FormControl>
            <FormLabel textStyle="subhead-1" color="secondary.500">
              Options
            </FormLabel>
            <Textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder={'Option 1\nOption 2'}
              rows={5}
            />
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
            isLoading={createFieldMutation.isLoading}
          >
            Create field
          </Button>
        </Flex>
      </Box>
    </Flex>
  )
}
