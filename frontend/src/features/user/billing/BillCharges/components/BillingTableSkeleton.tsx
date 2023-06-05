import { Box, Container, Skeleton } from '@chakra-ui/react'

const BillingTableSkeletonRow = (): JSX.Element => (
  <Box display="flex" flexDir="row" justifyContent="space-between" mb="1.5rem">
    <Skeleton w="38%" h="1rem" />
    <Skeleton w="23%" h="1rem" />
    <Skeleton w="16%" h="1rem" />
    <Skeleton w="14%" h="1rem" />
  </Box>
)

export const BillingTableSkeleton = (): JSX.Element => (
  <Container maxW="69.5rem">
    {Array(11)
      .fill(null)
      .map((_, i) => (
        <BillingTableSkeletonRow key={i} />
      ))}
  </Container>
)
