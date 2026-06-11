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

export const CreateEmailFieldForm = (): JSX.Element => {
  const { formId } = useParams()
  const queryClient = useQueryClient()

  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)
  const addField = useWorkflowBuilderStore((s) => s.addField)

  const fromStepId =
    focusState.type === 'create_field' ? focusState.fromStepId : undefined

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isRequired, setIsRequired] = useState(true)
  const [hasAutoReply, setHasAutoReply] = useState(false)
  const [isVerifiable, setIsVerifiable] = useState(false)
  const [hasAllowedDomains, setHasAllowedDomains] = useState(false)

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
        // Invalidate admin form cache so Build tab picks up the new field
        queryClient.invalidateQueries(adminFormKeys.id(formId!))
      },
    },
  )

  const navigateBack = useCallback(
    (pendingFieldId?: string) => {
      if (fromStepId) {
        setFocus({ type: 'step_edit', stepId: fromStepId, pendingFieldId })
      } else {
        setFocus({ type: 'default' })
      }
    },
    [setFocus, fromStepId],
  )

  const handleSave = useCallback(async () => {
    if (!name.trim()) return

    // Save to local Zustand store (for workflow dropdowns)
    addField({ name: name.trim(), fieldType: 'email' })
    const store = useWorkflowBuilderStore.getState()
    const newField = store.fields[store.fields.length - 1]

    // Also create via API so it appears in the Build tab
    try {
      await createFieldMutation.mutateAsync({
        fieldType: 'email',
        title: name.trim(),
        description: description.trim(),
        required: isRequired,
        disabled: false,
        isVerifiable: false,
        autoReplyOptions: {
          hasAutoReply: false,
          includeFormSummary: false,
          autoReplySubject: '',
          autoReplySender: '',
          autoReplyMessage: '',
        },
        hasAllowedEmailDomains: false,
        allowedEmailDomains: [],
      })
    } catch {
      // API call failed (e.g. no backend running) - field still exists locally
    }

    navigateBack(newField.id)
  }, [
    name,
    description,
    isRequired,
    addField,
    createFieldMutation,
    navigateBack,
  ])

  const canSave = name.trim().length > 0

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
          onClick={() => navigateBack()}
        />
        <Text
          textStyle="h4"
          as="h4"
          color="secondary.500"
          flex={1}
          textAlign="center"
        >
          Edit Email
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto">
        {/* Info box */}
        <Box px="1.5rem" pt="1.5rem">
          <InlineMessage>
            This field will be placed at the end of your form. You can arrange
            and edit it again in the Fields page.
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
              placeholder="e.g. Approver email"
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

        {/* Email confirmation */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Toggle
            label="Email confirmation"
            description="Customise an email acknowledgement to respondents"
            isChecked={hasAutoReply}
            onChange={() => setHasAutoReply(!hasAutoReply)}
          />
        </Box>

        <Divider />

        {/* OTP verification */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Toggle
            label="OTP verification"
            description="Respondents must verify by entering a code sent to this email."
            isChecked={isVerifiable}
            onChange={() => setIsVerifiable(!isVerifiable)}
          />
        </Box>

        <Divider />

        {/* Restrict email domains */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Toggle
            label="Restrict email domains"
            isChecked={hasAllowedDomains}
            onChange={() => setHasAllowedDomains(!hasAllowedDomains)}
          />
        </Box>

        {/* CTA */}
        <Divider />
        <Flex justify="flex-end" gap="0.75rem" px="1.5rem" py="1rem">
          <Button variant="clear" onClick={() => navigateBack()}>
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
