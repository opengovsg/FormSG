import { useMemo } from 'react'
import { BiMailSend } from 'react-icons/bi'
import {
  Box,
  Flex,
  HStack,
  Icon,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'

import {
  notificationRecipientIdsSelector,
  respondentsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { RespondentDropZone } from './RespondentDropZone'

type EmailNotificationCardProps = {
  isRespondentPhase?: boolean
  isFocused?: boolean
  /** True when another element (a step) has focus, so this card should hide interactive elements */
  anotherElementFocused?: boolean
}

/**
 * Card showing email notification config below WORKFLOW END divider.
 * During respondent phase, clickable to enter focus mode for notification recipients.
 */
export const EmailNotificationCard = ({
  isRespondentPhase = false,
  isFocused = false,
  anotherElementFocused = false,
}: EmailNotificationCardProps): JSX.Element => {
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const notificationRecipientIds = useWorkflowBuilderStore(
    notificationRecipientIdsSelector,
  )
  const unassignNotificationRecipient = useWorkflowBuilderStore(
    (s) => s.unassignNotificationRecipient,
  )
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)

  const notificationRespondents = useMemo(
    () => respondents.filter((r) => notificationRecipientIds.includes(r.id)),
    [respondents, notificationRecipientIds],
  )

  const handleClick = () => {
    if (isRespondentPhase && !isFocused) {
      setFocus({ type: 'notification_focus' })
    }
  }

  return (
    <Box
      w="100%"
      borderRadius="8px"
      bg="white"
      border={isFocused ? '2px solid' : '1px solid'}
      borderColor={isFocused ? 'primary.500' : 'neutral.300'}
      py="1.5rem"
      cursor={isRespondentPhase ? 'pointer' : undefined}
      onClick={handleClick}
      _hover={
        isRespondentPhase && !isFocused
          ? { borderColor: 'primary.500', bg: 'primary.100' }
          : undefined
      }
      transition="border-color 0.2s, background 0.2s"
    >
      {/* Header */}
      <Flex align="center" px="1.5rem">
        <HStack spacing="1rem">
          <Icon as={BiMailSend} fontSize="1.5rem" color="secondary.500" />
          <Text textStyle="subhead-1" color="secondary.500">
            Receive final email notification
          </Text>
        </HStack>
      </Flex>

      {/* Who gets notified */}
      <Stack spacing="0.5rem" px="1.5rem" mt="1.5rem">
        <Text textStyle="subhead-2" color="secondary.500">
          Who gets notified
        </Text>
        <Wrap spacing="0.25rem">
          {notificationRespondents.map((r) => (
            <WrapItem key={r.id}>
              <Tag
                size="sm"
                bg="primary.100"
                borderRadius="4px"
                px="0.5rem"
                py="0.25rem"
              >
                <TagLabel textStyle="caption-1" color="secondary.500">
                  {r.name}
                </TagLabel>
                {isRespondentPhase && (!anotherElementFocused || isFocused) && (
                  <TagCloseButton
                    onClick={() => unassignNotificationRecipient(r.id)}
                  />
                )}
              </Tag>
            </WrapItem>
          ))}
          {notificationRespondents.length === 0 && !isRespondentPhase && (
            <WrapItem>
              <Tag
                size="sm"
                bg="primary.100"
                borderRadius="4px"
                px="0.5rem"
                py="0.25rem"
              >
                <TagLabel textStyle="caption-1" color="secondary.500">
                  None
                </TagLabel>
              </Tag>
            </WrapItem>
          )}
        </Wrap>

        {/* Drop zone during respondent phase (hidden when another element is focused) */}
        {isRespondentPhase && (!anotherElementFocused || isFocused) && (
          <RespondentDropZone
            droppableId="respondent-drop-notification"
            droppableData={{ type: 'notification_drop' }}
            variant={isFocused ? 'step_focus' : 'pool'}
          />
        )}
      </Stack>
    </Box>
  )
}
