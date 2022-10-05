import { Box, Container, Skeleton } from '@chakra-ui/react'

export const FeedbackPageSkeleton = (): JSX.Element => {
  return (
    <Container maxW="69.5rem" mt="1.5rem">
      <Skeleton w="4rem" h="0.75rem"></Skeleton>
      <Box
        display="flex"
        flexDir="row"
        justifyContent="space-between"
        mb="1rem"
      >
        <Box display="flex" justifyContent="flex-start" alignItems="flex-end">
          <Box>
            <Skeleton mr="0.75rem" w="4.5rem" h="2rem" mt="0.5rem" />
          </Box>
          <Skeleton ml="2rem" w="14rem" h="2rem" />
        </Box>
        <Skeleton w="6rem" h="2rem" />
      </Box>
      <Skeleton w="100%" h="10rem" />
    </Container>
  )
}

export const FeedbackPageSkeletonMobile = (): JSX.Element => {
  return (
    <Container maxW="69.5rem" mt="1.5rem">
      <Skeleton w="14rem" h="2rem" mb="1rem" />
      <Skeleton w="4rem" h="0.75rem"></Skeleton>
      <Box
        display="flex"
        flexDir="row"
        justifyContent="space-between"
        mb="1rem"
      >
        <Box display="flex" justifyContent="flex-start" alignItems="flex-end">
          <Box>
            <Skeleton mr="0.75rem" w="4.5rem" h="2rem" mt="0.5rem" />
          </Box>
        </Box>
        <Skeleton w="6rem" h="2rem" />
      </Box>
      <Skeleton w="100%" h="10rem" />
    </Container>
  )
}
