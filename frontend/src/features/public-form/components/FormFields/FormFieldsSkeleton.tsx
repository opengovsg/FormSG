import { Flex, Skeleton } from '@chakra-ui/react'

export const FormFieldsSkeleton = (): JSX.Element => {
  return (
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
  )
}
