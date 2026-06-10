import { BiEnvelope } from 'react-icons/bi'
import {
  Box,
  Center,
  Divider,
  Flex,
  HStack,
  Icon,
  Stack,
  Tag,
  TagLabel,
  Text,
} from '@chakra-ui/react'

export const EndWorkflowCard = (): JSX.Element => {
  return (
    <Box
      bg="white"
      borderRadius="12px"
      border="1px solid"
      borderColor="neutral.300"
    >
      {/* Header */}
      <Flex justify="space-between" align="center" px="1.5rem" py="1rem">
        <HStack spacing="1rem" flex={1} minW={0}>
          <Center
            w="2rem"
            h="2rem"
            borderRadius="full"
            bg="neutral.200"
            flexShrink={0}
          >
            <Icon as={BiEnvelope} fontSize="1.25rem" color="secondary.400" />
          </Center>
          <Text textStyle="subhead-1" color="secondary.500" noOfLines={1}>
            Receive final email notification
          </Text>
        </HStack>
      </Flex>

      <Divider borderColor="neutral.300" />

      {/* Body */}
      <Box px="1.5rem" py="1rem">
        <Stack spacing="0.5rem">
          <Text textStyle="subhead-2" color="secondary.500">
            Recipients
          </Text>
          <Tag
            size="sm"
            bg="primary.100"
            borderRadius="4px"
            px="0.5rem"
            py="0.25rem"
            w="fit-content"
          >
            <TagLabel textStyle="caption-1" color="secondary.500">
              Collaborators on this form
            </TagLabel>
          </Tag>
        </Stack>
      </Box>
    </Box>
  )
}
