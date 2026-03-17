import { Box, Container, Skeleton } from '@chakra-ui/react'

export const FeedbackPageSkeleton = (): JSX.Element => {
  return (
    <Container maxW="69.5rem" mt="1.5rem">
      <Box
        display="flex"
        flexDir="row"
        justifyContent="space-between"
        mb="1rem"
        h="4rem"
      >
        <Box display="flex" justifyContent="flex-start" alignItems="center">
          <Skeleton w="18rem" h="2rem" />
        </Box>
        <Box display="flex" justifyContent="flex-end" alignItems="center">
          <Box>
            <Skeleton mr="0.75rem" w="10rem" h="2rem" />
          </Box>
          <Skeleton w="6rem" h="2rem" />
        </Box>
      </Box>
      <Skeleton w="100%" h="10rem" />
    </Container>
  )
}

export const FeedbackPageSkeletonMobile = (): JSX.Element => {
  return (
    <Container maxW="69.5rem" mt="1.5rem">
      <Skeleton w="14rem" h="2rem" />
      <Box
        flexDir="row"
        display="flex"
        justifyContent="space-between"
        alignItems="flex-end"
        mt="0.5rem"
      >
        <Skeleton w="8rem" h="2rem" />
        <Skeleton w="4.5rem" h="2rem" ml="0.5rem" />
      </Box>
    </Container>
  )
}
