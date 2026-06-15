import { Box, Divider, Flex, Text } from '@chakra-ui/react'

export const EndOfWorkflowDivider = (): JSX.Element => (
  <Box py="3rem">
    <Flex alignItems="center" gap="1rem">
      <Divider borderColor="secondary.300" />
      <Text
        textStyle="subhead-3"
        color="secondary.400"
        textTransform="uppercase"
        whiteSpace="nowrap"
        flexShrink={0}
      >
        End of workflow
      </Text>
      <Divider borderColor="secondary.300" />
    </Flex>
  </Box>
)
