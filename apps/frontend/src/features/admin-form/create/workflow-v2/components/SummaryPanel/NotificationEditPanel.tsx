import { useCallback, useEffect, useState } from 'react'
import { BiCheck, BiChevronRight, BiLeftArrowAlt, BiUser } from 'react-icons/bi'
import {
  Button,
  Center,
  chakra,
  Divider,
  Flex,
  Icon,
  IconButton,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import {
  notificationLabelSelector,
  notificationRecipientIdsSelector,
  setFocusSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

const MAX_NAME_LENGTH = 50

export const NotificationEditPanel = (): JSX.Element => {
  const setFocus = useWorkflowBuilderStore(setFocusSelector)
  const notificationLabel = useWorkflowBuilderStore(notificationLabelSelector)
  const notificationRecipientIds = useWorkflowBuilderStore(
    notificationRecipientIdsSelector,
  )
  const renameNotificationLabel = useWorkflowBuilderStore(
    (s) => s.renameNotificationLabel,
  )

  const [editName, setEditName] = useState(notificationLabel)

  // Sync local state if label changes externally
  useEffect(() => {
    setEditName(notificationLabel)
  }, [notificationLabel])

  const handleBack = useCallback(() => {
    setFocus({ type: 'summary' })
  }, [setFocus])

  const handleNameBlur = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== notificationLabel) {
      renameNotificationLabel(trimmed)
    } else {
      setEditName(notificationLabel)
    }
  }

  const hasRecipients = notificationRecipientIds.length > 0

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
          aria-label="Back to summary"
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
          Edit notification
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Content */}
      <Flex
        flex={1}
        overflow="auto"
        px="1.5rem"
        pt="1rem"
        pb="1.5rem"
        flexDir="column"
      >
        {/* Notification label input - matching StepNamingForm style */}
        <Stack spacing="0.5rem">
          <Text textStyle="subhead-1" color="secondary.500">
            Step name
          </Text>
          <Input
            value={editName}
            onChange={(e) => {
              if (e.target.value.length <= MAX_NAME_LENGTH)
                setEditName(e.target.value)
            }}
            onBlur={handleNameBlur}
            maxLength={MAX_NAME_LENGTH}
          />
          <Text textStyle="caption-1" color="secondary.400" textAlign="right">
            ({editName.length}/{MAX_NAME_LENGTH})
          </Text>
        </Stack>

        {/* Divider below label */}
        <Divider mx="-1.5rem" w="auto" mt="1rem" mb="1rem" />

        {/* Sub-task card: Manage recipients */}
        <Stack spacing="0.5rem">
          <chakra.button
            w="100%"
            textAlign="start"
            borderRadius="8px"
            bg="transparent"
            border="2px solid"
            borderColor="transparent"
            py="0.75rem"
            px="1rem"
            cursor="pointer"
            transition="all 0.15s"
            _hover={{ bg: 'neutral.100' }}
            onClick={() =>
              setFocus({
                type: 'notification_focus',
                fromNotificationEdit: true,
              })
            }
          >
            <Flex align="center" gap="0.75rem">
              {hasRecipients ? (
                <Center
                  w="2rem"
                  h="2rem"
                  borderRadius="full"
                  bg="success.500"
                  flexShrink={0}
                >
                  <Icon as={BiCheck} fontSize="1.25rem" color="white" />
                </Center>
              ) : (
                <Center
                  w="2rem"
                  h="2rem"
                  borderRadius="full"
                  bg="neutral.200"
                  flexShrink={0}
                >
                  <Icon as={BiUser} fontSize="1.25rem" color="secondary.400" />
                </Center>
              )}
              <Text
                textStyle="subhead-1"
                color="secondary.500"
                flex={1}
                noOfLines={1}
              >
                Manage recipients
              </Text>
              <Icon
                as={BiChevronRight}
                fontSize="1.25rem"
                color="secondary.400"
                flexShrink={0}
              />
            </Flex>
          </chakra.button>
        </Stack>

        {/* Footer: done editing */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" py="1rem">
          <Button variant="outline" colorScheme="primary" onClick={handleBack}>
            Done editing
          </Button>
        </Flex>
      </Flex>
    </Flex>
  )
}
