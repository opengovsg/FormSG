import { useTranslation } from 'react-i18next'
import { BiPencil } from 'react-icons/bi'
import { Box, chakra, Flex, Icon, Stack, Text, Tooltip } from '@chakra-ui/react'

import { MultirespondentFormSettings } from 'formsg-shared/types'

import { useAdminFormSettings } from '~features/admin-form/settings/queries'

import { useAdminFormWorkflow } from '../../hooks/useAdminFormWorkflow'

import { EmailLabel } from './EmailLabel'

interface InactiveEmailCardProps {
  onEdit: () => void
}

export const InactiveEmailCard = ({
  onEdit,
}: InactiveEmailCardProps): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings } = useAdminFormSettings<MultirespondentFormSettings>()
  const { idToFieldMap, formWorkflow } = useAdminFormWorkflow()

  const hasStepOneField = !!settings?.stepOneEmailNotificationFieldId
  const stepOneField = hasStepOneField
    ? idToFieldMap[settings.stepOneEmailNotificationFieldId]
    : undefined

  const stepsToNotify = settings?.stepsToNotify ?? []
  const emails = settings?.emails ?? []

  const hasAnyRecipient =
    hasStepOneField || stepsToNotify.length > 0 || emails.length > 0

  return (
    <Box pos="relative" role="group">
      <chakra.button
        type="button"
        w="100%"
        textAlign="start"
        borderRadius="8px"
        bg="white"
        border="1px solid"
        borderColor="neutral.300"
        _hover={{ borderColor: 'primary.500', bg: 'primary.50' }}
        transitionProperty="common"
        transitionDuration="normal"
        cursor="pointer"
        onClick={onEdit}
        pos="relative"
      >
        <Stack spacing="1.5rem" p={{ base: '1.5rem', md: '2rem' }}>
          <EmailLabel />

          <Stack>
            <Text textStyle="subhead-2">
              People who will receive the completion email
            </Text>
            {hasAnyRecipient ? (
              <Stack spacing="0.25rem">
                {stepOneField && (
                  <Text textStyle="body-2" color="secondary.500">
                    Person in Step 1: {stepOneField.title}
                  </Text>
                )}
                {stepsToNotify.length > 0 && (
                  <Text textStyle="body-2" color="secondary.500">
                    {stepsToNotify.length} other step(s) notified
                  </Text>
                )}
                {emails.length > 0 && (
                  <Text textStyle="body-2" color="secondary.500">
                    {emails.join(', ')}
                  </Text>
                )}
              </Stack>
            ) : (
              <Text textStyle="body-2" color="secondary.400">
                No recipients added yet
              </Text>
            )}
          </Stack>
        </Stack>
        <Flex
          pos="absolute"
          top={{ base: '0.5rem', md: '2rem' }}
          right={{ base: '0.5rem', md: '2rem' }}
          alignItems="center"
        >
          <Tooltip label="Edit" placement="top" hasArrow openDelay={300}>
            <Box display="inline-flex">
              <Icon
                as={BiPencil}
                boxSize="1.25rem"
                color="secondary.300"
                _groupHover={{ color: 'primary.500' }}
                transition="color 0.15s ease"
              />
            </Box>
          </Tooltip>
        </Flex>
      </chakra.button>
    </Box>
  )
}
