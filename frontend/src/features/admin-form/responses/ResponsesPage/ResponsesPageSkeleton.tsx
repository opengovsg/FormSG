import { Box, Container, Skeleton, Stack } from '@chakra-ui/react'

export const ResponsesPageSkeleton = (): JSX.Element => (
  <Container p={0} maxW="42.5rem">
    <Stack spacing="2rem">
      <Skeleton h="144px" w="144px" />
      <Skeleton h="3rem" w="310px" />
      <Box flex={1}>
        <Skeleton h="1rem" mb="0.5rem" />
        <Skeleton h="1rem" />
      </Box>
      <Skeleton h="3rem" />
    </Stack>
  </Container>
)
