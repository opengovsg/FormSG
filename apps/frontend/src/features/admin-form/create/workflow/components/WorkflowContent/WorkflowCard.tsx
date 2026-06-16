import { Box, Divider, Stack, Text } from '@chakra-ui/react'

import { StatusTrackerToggle } from '~features/admin-form/settings/components/EmailNotificationsSection/StatusTrackerToggle'

interface WorkflowCardProps {
  showSubheader?: boolean
  showStatusToggle?: boolean
}

export const WorkflowCard = ({
  showSubheader = false,
  showStatusToggle = true,
}: WorkflowCardProps): JSX.Element => {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      borderRadius="4px"
      padding="1.5rem"
    >
      <Stack gap="1.5rem">
        <Text as="h2" textStyle="h2">
          Workflow
        </Text>
        {showSubheader && (
          <Text textStyle="body-2" color="secondary.400">
            A workflow passes your form between people. Each step is handled by
            a different person.
          </Text>
        )}
        {showStatusToggle && (
          <>
            <Divider />
            <StatusTrackerToggle />
          </>
        )}
      </Stack>
    </Box>
  )
}
