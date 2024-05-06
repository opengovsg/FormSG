import { Box, Container, Flex, Skeleton } from '@chakra-ui/react'

export const LogicSkeleton = (): JSX.Element => {
  return (
    <Box flex={1} overflow="auto" bg="grey.50">
      <Flex
        py={{ base: '2rem', md: '4rem' }}
        px={{ base: '1.5rem', md: '3.75rem' }}
      >
        <Container p={0} maxW="42.5rem">
          <Skeleton h="3rem" mb="0.5rem" />
          <Skeleton h="3rem" mb="1.5rem" />
          <Skeleton h="3rem" mb="0.5rem" />
          <Skeleton h="3rem" mb="4rem" />
          <Skeleton h="3rem" mb="0.5rem" />
          <Skeleton h="3rem" mb="1.5rem" />
          <Skeleton h="3rem" mb="0.5rem" />
          <Skeleton h="3rem" />
        </Container>
      </Flex>
    </Box>
  )
}
