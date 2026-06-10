import { useCallback, useMemo, useState } from 'react'
import { BiChevronDown, BiLeftArrowAlt, BiX } from 'react-icons/bi'
import {
  Box,
  Checkbox,
  Divider,
  Flex,
  Icon,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'

import Button from '~components/Button'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useDesignColorTheme } from '~features/admin-form/create/builder-and-design/utils/useDesignColorTheme'
import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import {
  setFocusSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

// Local state for notification settings (not persisted to store yet)
type NotificationSettings = {
  collaborators: boolean
  specificEmails: boolean
  emailField: boolean
  emails: string[]
  selectedEmailFieldId: string | null
}

const DEFAULT_SETTINGS: NotificationSettings = {
  collaborators: true,
  specificEmails: false,
  emailField: false,
  emails: [],
  selectedEmailFieldId: null,
}

// Mock email tag input
const MockEmailTags = ({
  emails,
  onRemove,
}: {
  emails: string[]
  onRemove?: (email: string) => void
}): JSX.Element => (
  <Flex
    border="1px solid"
    borderColor="neutral.400"
    borderRadius="4px"
    px="0.5rem"
    py="0.375rem"
    wrap="wrap"
    gap="0.25rem"
    bg="white"
    mt="0.5rem"
    minH="2.75rem"
    align="center"
  >
    {emails.length > 0 ? (
      emails.map((email) => (
        <Flex
          key={email}
          bg="primary.100"
          borderRadius="4px"
          px="0.5rem"
          py="0.25rem"
          align="center"
          gap="0.25rem"
        >
          <Text textStyle="body-2" color="primary.500">
            {email}
          </Text>
          <Icon
            as={BiX}
            fontSize="0.75rem"
            color="primary.500"
            cursor="pointer"
            onClick={() => onRemove?.(email)}
          />
        </Flex>
      ))
    ) : (
      <Text textStyle="body-1" color="neutral.500">
        Enter email addresses
      </Text>
    )}
  </Flex>
)

export const EndWorkflowDetailPanel = (): JSX.Element => {
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const { data: form } = useAdminForm()

  const colorTheme = useDesignColorTheme()
  const checkboxColorScheme = colorTheme ? `theme-${colorTheme}` : 'theme-blue'

  const [settings, setSettings] =
    useState<NotificationSettings>(DEFAULT_SETTINGS)

  const emailFields = useMemo(() => {
    if (!form?.form_fields) return []
    return form.form_fields
      .map((f, i) => ({ id: f._id, title: f.title, number: i + 1 }))
      .filter((_, i) => form.form_fields[i].fieldType === 'email')
  }, [form?.form_fields])

  const handleBack = useCallback(() => {
    setFocus({ type: 'default' })
  }, [setFocus])

  return (
    <Flex h="100%" flexDir="column">
      {/* Sticky header - subflow pattern */}
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
          aria-label="Back to workflow"
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
          Receive final email notification
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto">
        <Box px="1.5rem" pt="1.5rem" pb="1.5rem">
          <Text textStyle="subhead-1" color="secondary.500" mb="0.75rem">
            Recipients
          </Text>
          <Text textStyle="caption-1" color="secondary.400" mb="1rem">
            Select who should receive an email when the workflow is complete.
          </Text>

          <Stack spacing="0.75rem">
            {/* Collaborators */}
            <Box>
              <Checkbox
                isChecked={settings.collaborators}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    collaborators: e.target.checked,
                  }))
                }
                colorScheme={checkboxColorScheme}
                spacing="0.75rem"
              >
                <Text textStyle="body-1" color="secondary.500">
                  Collaborators on this form
                </Text>
              </Checkbox>
            </Box>

            {/* Specific emails */}
            <Box>
              <Checkbox
                isChecked={settings.specificEmails}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    specificEmails: e.target.checked,
                  }))
                }
                colorScheme={checkboxColorScheme}
                spacing="0.75rem"
              >
                <Text textStyle="body-1" color="secondary.500">
                  Specific email(s)
                </Text>
              </Checkbox>
              {settings.specificEmails && (
                <Box ml="1.75rem">
                  <MockEmailTags
                    emails={settings.emails}
                    onRemove={(email) =>
                      setSettings((s) => ({
                        ...s,
                        emails: s.emails.filter((e) => e !== email),
                      }))
                    }
                  />
                </Box>
              )}
            </Box>

            {/* Email field */}
            <Box>
              <Checkbox
                isChecked={settings.emailField}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    emailField: e.target.checked,
                  }))
                }
                colorScheme={checkboxColorScheme}
                spacing="0.75rem"
              >
                <Text textStyle="body-1" color="secondary.500">
                  Email field
                </Text>
              </Checkbox>
              {settings.emailField && (
                <Box ml="1.75rem" mt="0.5rem">
                  {emailFields.length > 0 ? (
                    <Box
                      as="select"
                      border="1px solid"
                      borderColor="neutral.400"
                      borderRadius="4px"
                      px="1rem"
                      h="2.75rem"
                      w="100%"
                      bg="white"
                      textStyle="body-1"
                      color={
                        settings.selectedEmailFieldId
                          ? 'secondary.500'
                          : 'neutral.500'
                      }
                      value={settings.selectedEmailFieldId ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        setSettings((s) => ({
                          ...s,
                          selectedEmailFieldId: e.target.value || null,
                        }))
                      }}
                    >
                      <option value="" disabled>
                        Select an email field
                      </option>
                      {emailFields.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.number}. {f.title}
                        </option>
                      ))}
                    </Box>
                  ) : (
                    <Text textStyle="caption-1" color="secondary.400">
                      No email fields in this form yet.
                    </Text>
                  )}
                </Box>
              )}
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Footer */}
      <Divider />
      <Flex justify="flex-end" gap="0.75rem" px="1.5rem" py="1rem" bg="white">
        <Button variant="clear" colorScheme="secondary" onClick={handleBack}>
          Cancel
        </Button>
        <Button colorScheme="primary" onClick={handleBack}>
          Done
        </Button>
      </Flex>
    </Flex>
  )
}
