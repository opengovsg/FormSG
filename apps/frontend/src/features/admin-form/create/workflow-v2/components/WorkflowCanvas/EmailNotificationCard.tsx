import { useMemo } from 'react'
import { BiEditAlt, BiLock, BiMailSend, BiPlus } from 'react-icons/bi'
import {
  Box,
  Center,
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
import { useDroppable } from '@dnd-kit/core'

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
  /** True when a respondent card is being dragged */
  isDraggingRespondent?: boolean
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
  isDraggingRespondent = false,
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

  // Whole-card droppable for respondent drag
  const { setNodeRef: setNotifDropRef, isOver: isNotifDropOver } = useDroppable(
    {
      id: 'card-notif-respondent-drop',
      data: { type: 'notification_drop' },
      disabled: !isDraggingRespondent,
    },
  )

  return (
    <Box position="relative">
      {/* Drop zone layer - fades in when respondent is being dragged */}
      <Box
        opacity={isDraggingRespondent ? 1 : 0}
        pointerEvents={isDraggingRespondent ? 'auto' : 'none'}
        transition="opacity 0.2s ease"
        position={isDraggingRespondent ? 'relative' : 'absolute'}
        inset={isDraggingRespondent ? undefined : 0}
      >
        <Box
          w="100%"
          borderRadius="12px"
          bg="white"
          border="1px solid"
          borderColor={isNotifDropOver ? 'primary.500' : 'neutral.300'}
          p="0.75rem"
          transition="border-color 0.15s"
        >
          <Center
            ref={setNotifDropRef}
            w="100%"
            py="1rem"
            px="1rem"
            borderRadius="4px"
            border="2px dashed"
            borderColor={isNotifDropOver ? 'primary.500' : 'primary.400'}
            bg={isNotifDropOver ? 'primary.200' : 'primary.100'}
            transition="background 0.15s, border-color 0.15s"
          >
            <Text textStyle="subhead-2" color="primary.500" textAlign="center">
              + Drag into {notificationLabel}
            </Text>
          </Center>
        </Box>
      </Box>

      {/* Normal card content - fades out when drop zone shows */}
      <Box
        opacity={isDraggingRespondent ? 0 : isDisabled ? 0.5 : 1}
        pointerEvents={isDraggingRespondent || isDisabled ? 'none' : 'auto'}
        transition="opacity 0.2s ease"
        position={isDraggingRespondent ? 'absolute' : 'relative'}
        inset={isDraggingRespondent ? 0 : undefined}
        w="100%"
      >
        <Box
          data-email-card
          w="100%"
          borderRadius="12px"
          bg="white"
          border={isHighlighted ? '2px solid' : '1px solid'}
          borderColor={isHighlighted ? 'primary.500' : 'neutral.300'}
          py="1.5rem"
          cursor={isClickable ? 'pointer' : undefined}
          onClick={handleClick}
          _hover={
            showHover
              ? { borderColor: 'primary.500', bg: 'primary.100' }
              : undefined
          }
          transition="border-color 0.2s, background 0.2s"
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
                    {isRespondentPhase &&
                      (!anotherElementFocused || isFocused) && (
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
      </Box>

      {/* Lock icon when not a valid target */}
      {isDisabled && !isDraggingRespondent && (
        <Box position="absolute" top="0.75rem" right="0.75rem" zIndex={3}>
          <Icon as={BiLock} fontSize="1.25rem" color="secondary.400" />
        </Box>
      )}
    </Box>
  )
}
