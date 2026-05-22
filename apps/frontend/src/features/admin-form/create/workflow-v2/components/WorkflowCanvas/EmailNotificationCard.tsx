import { useMemo } from 'react'
import { BiEditAlt, BiMailSend } from 'react-icons/bi'
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
  notificationLabelSelector,
  notificationRecipientIdsSelector,
  respondentsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { RespondentDropZone } from './RespondentDropZone'

type EmailNotificationCardProps = {
  isRespondentPhase?: boolean
  isFocused?: boolean
  isNotificationEdit?: boolean
  isSummaryMode?: boolean
  /** True when another element (a step) has focus, so this card should hide interactive elements */
  anotherElementFocused?: boolean
  /** True during add steps and assign fields phases to fade and disable the card */
  isDisabled?: boolean
}

/**
 * Card showing email notification config below WORKFLOW END divider.
 * During respondent phase, clickable to enter focus mode for notification recipients.
 */
export const EmailNotificationCard = ({
  isRespondentPhase = false,
  isFocused = false,
  isNotificationEdit = false,
  isSummaryMode = false,
  anotherElementFocused = false,
  isDisabled = false,
}: EmailNotificationCardProps): JSX.Element => {
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const notificationRecipientIds = useWorkflowBuilderStore(
    notificationRecipientIdsSelector,
  )
  const notificationLabel = useWorkflowBuilderStore(notificationLabelSelector)
  const unassignNotificationRecipient = useWorkflowBuilderStore(
    (s) => s.unassignNotificationRecipient,
  )
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)

  const notificationRespondents = useMemo(
    () => respondents.filter((r) => notificationRecipientIds.includes(r.id)),
    [respondents, notificationRecipientIds],
  )

  const isClickable = isRespondentPhase || isSummaryMode
  const isHighlighted = isFocused || isNotificationEdit

  const handleClick = () => {
    if (isRespondentPhase && !isFocused) {
      setFocus({ type: 'notification_focus' })
    } else if (isSummaryMode && !isNotificationEdit) {
      setFocus({ type: 'notification_edit' })
    }
  }

  // Hoverable when clickable OR when in respondent phase with another element focused
  const showHover = (isClickable || isRespondentPhase) && !isHighlighted

  return (
    <Box
      data-email-card
      w="100%"
      borderRadius="12px"
      bg="white"
      border={isHighlighted ? '2px solid' : '1px solid'}
      borderColor={isHighlighted ? 'primary.500' : 'neutral.300'}
      py="1.5rem"
      cursor={isDisabled ? undefined : isClickable ? 'pointer' : undefined}
      onClick={isDisabled ? undefined : handleClick}
      _hover={
        !isDisabled && showHover
          ? { borderColor: 'primary.500', bg: 'primary.100' }
          : undefined
      }
      opacity={isDisabled ? 0.5 : 1}
      pointerEvents={isDisabled ? 'none' : undefined}
      transition="border-color 0.2s, background 0.2s, opacity 0.2s"
    >
      {/* Header */}
      <Flex justify="space-between" align="center" px="1.5rem">
        <HStack spacing="1rem" flex={1} minW={0}>
          <Icon
            as={BiMailSend}
            fontSize="1.5rem"
            color="secondary.500"
            flexShrink={0}
          />
          <Text textStyle="subhead-1" color="secondary.500" noOfLines={1}>
            {notificationLabel}
          </Text>
        </HStack>
        {isSummaryMode && (
          <HStack
            spacing="0.5rem"
            flexShrink={0}
            opacity={0}
            transition="opacity 0.15s ease"
            sx={{ '[data-email-card]:hover &': { opacity: 1 } }}
          >
            <Box p="0.25rem" display="flex" alignItems="center">
              <Icon as={BiEditAlt} fontSize="1.25rem" color="neutral.500" />
            </Box>
          </HStack>
        )}
      </Flex>

      {/* Who gets notified */}
      <Stack spacing="0.5rem" px="1.5rem" mt="1rem">
        <Text textStyle="subhead-2" color="secondary.500">
          Recipients
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
