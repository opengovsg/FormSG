import { useCallback, useState } from 'react'
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

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import type { RespondentType } from '../../types'
import {
  focusStateSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

const MAX_NAME_LENGTH = 50

export const NewRespondentForm = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)
  const addRespondent = useWorkflowBuilderStore((s) => s.addRespondent)
  const assignRespondent = useWorkflowBuilderStore((s) => s.assignRespondent)

  const fromStepId =
    focusState.type === 'new_respondent' ? focusState.fromStepId : undefined

  const [name, setName] = useState('')
  const [respondentType, setRespondentType] =
    useState<RespondentType>('specific_email')
  const [emails, setEmails] = useState('')

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

    // Generate ID in component so we can use it for auto-assign
    const newId = `resp-${Date.now()}`

    const description =
      respondentType === 'specific_email' && emails.trim()
        ? emails.trim()
        : undefined

    addRespondent({
      name: name.trim(),
      type: respondentType,
      description,
      email: respondentType === 'specific_email' ? emails.trim() : undefined,
      isCustom: true,
    })

    // Auto-assign to step if created from step-focus
    if (fromStepId) {
      // The addRespondent generates its own ID internally, so we need to
      // find the respondent we just added by matching on name + timestamp proximity.
      // Simpler approach: we know the store generates `resp-${Date.now()}` IDs,
      // and we called addRespondent just above, so the latest respondent is ours.
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
    fromStepId,
    addRespondent,
    assignRespondent,
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
              onChange={(val) => setRespondentType(val as RespondentType)}
            >
              <Stack spacing="1rem">
                {/* Email field - disabled in 3a */}
                <Radio value="email_field" isDisabled colorScheme="primary">
                  <Text textStyle="body-1" color="secondary.400">
                    An email field from the form
                  </Text>
                </Radio>

                {/* Specific emails - active */}
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

                {/* Dropdown field - disabled in 3a */}
                <Radio value="dropdown_field" isDisabled colorScheme="primary">
                  <Text textStyle="body-1" color="secondary.400">
                    Emails assigned to options in a dropdown field
                  </Text>
                </Radio>
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
    </Flex>
  )
}
