import { Skeleton, Stack } from '@chakra-ui/react'

export const FormBuilderFieldsSkeleton = (): JSX.Element => (
  <Stack spacing="3rem" p={{ md: '1.5rem' }}>
    <Skeleton h="2rem" />
    <Skeleton h="4rem" />
    <Skeleton h="10rem" />
    <Skeleton h="4rem" />
  </Stack>
)
