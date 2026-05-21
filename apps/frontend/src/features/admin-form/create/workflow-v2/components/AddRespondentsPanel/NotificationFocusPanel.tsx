import { useCallback, useMemo } from 'react'
import { BiLeftArrowAlt, BiPlus } from 'react-icons/bi'
import {
  Box,
  Button,
  Divider,
  Flex,
  Icon,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import {
  focusStateSelector,
  notificationRecipientIdsSelector,
  respondentsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { RespondentCard } from './RespondentCard'

export const NotificationFocusPanel = (): JSX.Element => {
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const notificationRecipientIds = useWorkflowBuilderStore(
    notificationRecipientIdsSelector,
  )
  const focusState = useWorkflowBuilderStore(focusStateSelector)
  const setFocus = useWorkflowBuilderStore((s) => s.setFocus)
  const assignNotificationRecipient = useWorkflowBuilderStore(
    (s) => s.assignNotificationRecipient,
  )
  const unassignNotificationRecipient = useWorkflowBuilderStore(
    (s) => s.unassignNotificationRecipient,
  )

  // Exclude form_link from notification recipients list
  const assignableRespondents = useMemo(
    () => respondents.filter((r) => r.type !== 'form_link'),
    [respondents],
  )

  const handleBack = useCallback(() => {
    if (
      focusState.type === 'notification_focus' &&
      focusState.fromNotificationEdit
    ) {
      setFocus({ type: 'notification_edit' })
    } else {
      setFocus({ type: 'phase', phase: 'add_respondents' })
    }
  }, [focusState, setFocus])

  const handleToggle = useCallback(
    (respondentId: string) => {
      if (notificationRecipientIds.includes(respondentId)) {
        unassignNotificationRecipient(respondentId)
      } else {
        assignNotificationRecipient(respondentId)
      }
    },
    [
      notificationRecipientIds,
      assignNotificationRecipient,
      unassignNotificationRecipient,
    ],
  )

  const handleAddNewRespondent = useCallback(() => {
    setFocus({ type: 'new_respondent' })
  }, [setFocus])

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
          aria-label="Back to pool"
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
          Select who gets notified
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        <Stack spacing="0.5rem">
          {assignableRespondents.map((r) => (
            <RespondentCard
              key={r.id}
              respondent={r}
              showCheckbox
              isChecked={notificationRecipientIds.includes(r.id)}
              onToggle={() => handleToggle(r.id)}
            />
          ))}
        </Stack>

        {/* Add new respondent */}
        <Button
          variant="clear"
          colorScheme="primary"
          leftIcon={<Icon as={BiPlus} fontSize="1.25rem" />}
          mt="0.5rem"
          onClick={handleAddNewRespondent}
        >
          Add a new respondent
        </Button>

        {/* CTA */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" py="1rem">
          <Button variant="outline" colorScheme="primary" onClick={handleBack}>
            Done with this step
          </Button>
        </Flex>
      </Box>
    </Flex>
  )
}
