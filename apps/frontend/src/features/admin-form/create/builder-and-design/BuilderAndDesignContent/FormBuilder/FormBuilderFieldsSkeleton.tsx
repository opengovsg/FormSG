import { Skeleton, Stack } from '@chakra-ui/react'

export const FormBuilderFieldsSkeleton = (): JSX.Element => (
  <Stack
    spacing="3rem"
    px={{ base: '0.5rem', md: '1.625rem' }}
    py={{ base: '0.5rem', md: '2.5rem' }}
  >
    <Skeleton h="2rem" />
    <Skeleton h="4rem" />
    <Skeleton h="10rem" />
    <Skeleton h="4rem" />
  </Stack>
)
