import { Box, Flex, Skeleton, Spacer, Stack } from '@chakra-ui/react'

export const FormFieldsSkeleton = (): JSX.Element => {
  return (
    <Flex flex={1} justify="center">
      <Box bg="white" p="2.5rem" w="100%" minW={0} maxW="57rem">
        <Stack spacing="2.25rem">
          <Flex flexDir="column">
            <Skeleton height="2rem" />
            <Skeleton height="1.5rem" mt="2.25rem" />
            <Skeleton height="2.75rem" mt="0.75rem" />
            <Skeleton height="1.5rem" mt="2.25rem" />
            <Skeleton height="2.75rem" mt="0.75rem" />
            <Skeleton height="1.5rem" mt="2.25rem" />
            <Skeleton height="2.75rem" mt="0.75rem" />
            <Skeleton height="1.5rem" mt="2.25rem" />
            <Skeleton height="2.75rem" mt="0.75rem" />
          </Flex>
        </Stack>
      </Box>
      <Spacer />
    </Flex>
  )
}
