import { Box, Divider, Flex, Text } from '@chakra-ui/react'

import { StatusTrackerToggle } from '~/features/admin-form/settings/components/EmailNotificationsSection/StatusTrackerToggle'

import { CreatePageDrawerCloseButton } from '../../../common/CreatePageDrawer/CreatePageDrawerCloseButton'
import { WorkflowCompletionMessageBlock } from '../WorkflowContent/WorkflowCompletionMessageBlock'

export const WorkflowDrawer = (): JSX.Element => {
  return (
    <Flex pos="relative" h="100%" display="flex" flexDir="column">
      {/* Header section */}
      <Box pt="1rem" px="1.5rem" bg="white">
        <Flex justify="space-between">
          <Text textStyle="subhead-3" color="secondary.500" mb="1rem">
            Workflow Settings
          </Text>
          <CreatePageDrawerCloseButton />
        </Flex>
        <Divider w="auto" mx="-1.5rem" />
      </Box>

      {/* Content section - scrollable */}
      <Box
        pb="1rem"
        px="1.5rem"
        pt="1.5rem"
        flex={1}
        overflowY="auto"
        bg="white"
      >
        <Box maxW="100%">
          <StatusTrackerToggle />
          <Divider my="1.5rem" mx="-1.5rem" w="auto" />
          <WorkflowCompletionMessageBlock />
        </Box>
      </Box>
    </Flex>
  )
}
