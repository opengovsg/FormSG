import { ReactNode } from 'react'
import { Box, Divider, Flex, Stack, Text } from '@chakra-ui/react'

import { StatusTrackerToggle } from '~features/admin-form/settings/components/EmailNotificationsSection/StatusTrackerToggle'

interface WorkflowCardProps {
  title?: string
  showSubheader?: boolean
  showStatusToggle?: boolean
  belowToggle?: ReactNode
  footer?: ReactNode
  headerRight?: ReactNode
}

export const WorkflowCard = ({
  title = 'Workflow',
  showSubheader = false,
  showStatusToggle = true,
  belowToggle,
  footer,
  headerRight,
}: WorkflowCardProps): JSX.Element => {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      borderRadius="8px"
      padding="1.5rem"
    >
      <Stack gap="1.5rem">
        <Flex justify="space-between" align="center">
          <Stack gap="0.25rem">
            <Text as="h2" textStyle="h2">
              {title}
            </Text>
            {showSubheader && (
              <Text textStyle="body-2" color="secondary.400">
                A workflow passes your form between people. Each step has
                someone who fills in or reviews the form.
              </Text>
            )}
          </Stack>
          {headerRight}
        </Flex>
        {showStatusToggle && (
          <>
            <Divider mx="-1.5rem" w="auto" />
            {belowToggle ? (
              <Box
                bg="primary.100"
                borderRadius="8px"
                border="2px solid"
                borderColor="primary.500"
                p="1.5rem"
              >
                <Stack gap="1rem">
                  <StatusTrackerToggle />
                  {belowToggle}
                </Stack>
              </Box>
            ) : (
              <StatusTrackerToggle />
            )}
          </>
        )}
        {footer}
      </Stack>
    </Box>
  )
}
