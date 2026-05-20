import { BiMailSend } from 'react-icons/bi'
import {
  Box,
  Flex,
  HStack,
  Icon,
  Stack,
  Tag,
  TagLabel,
  Text,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'

/**
 * Card showing email notification config below WORKFLOW END divider.
 * Matches Step card styling: white bg, 1px neutral.300 border, 8px radius, 24px padding.
 */
export const EmailNotificationCard = (): JSX.Element => {
  return (
    <Box
      w="100%"
      borderRadius="8px"
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      py="1.5rem"
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
          <WrapItem>
            <Tag
              size="sm"
              bg="primary.100"
              borderRadius="4px"
              px="0.5rem"
              py="0.25rem"
            >
              <TagLabel textStyle="caption-1" color="secondary.500">
                Collaborators on this form
              </TagLabel>
            </Tag>
          </WrapItem>
        </Wrap>
      </Stack>
    </Box>
  )
}
