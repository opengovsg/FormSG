import { useCallback, useMemo, useState } from 'react'
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
  respondentsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

const MAX_NAME_LENGTH = 50

export const EditRespondentForm = (): JSX.Element => {
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)
  const updateRespondent = useWorkflowBuilderStore((s) => s.updateRespondent)

  const respondentId =
    focusState.type === 'edit_respondent' ? focusState.respondentId : ''

  const respondent = useMemo(
    () => respondents.find((r) => r.id === respondentId),
    [respondents, respondentId],
  )

  const [name, setName] = useState(respondent?.name ?? '')
  const [respondentType] = useState<RespondentType>(
    respondent?.type ?? 'specific_email',
  )
  const [emails, setEmails] = useState(respondent?.email ?? '')

  const navigateBack = useCallback(() => {
    setFocus({ type: 'phase', phase: 'add_respondents' })
  }, [setFocus])

  const handleSave = useCallback(() => {
    if (!name.trim() || !respondentId) return

    updateRespondent(respondentId, {
      name: name.trim(),
      description:
        respondentType === 'specific_email' && emails.trim()
          ? emails.trim()
          : respondent?.description,
      email:
        respondentType === 'specific_email' ? emails.trim() : respondent?.email,
    })

    navigateBack()
  }, [
    name,
    respondentType,
    emails,
    respondentId,
    respondent,
    updateRespondent,
    navigateBack,
  ])

  if (!respondent) return <Box />

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

        {/* Respondent type (read-only display) */}
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <FormControl>
            <FormLabel textStyle="subhead-1" color="secondary.500">
              Respondent type
            </FormLabel>
            <RadioGroup value={respondentType}>
              <Stack spacing="1rem">
                <Radio
                  value="email_field"
                  isDisabled={respondentType !== 'email_field'}
                  colorScheme="primary"
                >
                  <Text
                    textStyle="body-1"
                    color={
                      respondentType === 'email_field'
                        ? 'secondary.500'
                        : 'secondary.400'
                    }
                  >
                    An email field from the form
                  </Text>
                </Radio>

                <Box>
                  <Radio
                    value="specific_email"
                    isDisabled={respondentType !== 'specific_email'}
                    colorScheme="primary"
                  >
                    <Text
                      textStyle="body-1"
                      color={
                        respondentType === 'specific_email'
                          ? 'secondary.500'
                          : 'secondary.400'
                      }
                    >
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

                <Radio
                  value="dropdown_field"
                  isDisabled={respondentType !== 'dropdown_field'}
                  colorScheme="primary"
                >
                  <Text
                    textStyle="body-1"
                    color={
                      respondentType === 'dropdown_field'
                        ? 'secondary.500'
                        : 'secondary.400'
                    }
                  >
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
            Save changes
          </Button>
        </Flex>
      </Box>
    </Flex>
  )
}
