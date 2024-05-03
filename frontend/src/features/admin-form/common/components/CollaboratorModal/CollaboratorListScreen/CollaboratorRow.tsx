import { Skeleton, Stack, Text } from '@chakra-ui/react'

interface CollaboratorRowProps {
  email: string | undefined
  isCurrentUser: boolean
  isLoading?: boolean
  children: React.ReactNode
}

export const CollaboratorText = ({ children }: { children?: string }) => {
  return (
    <Text
      textStyle={{ base: 'subhead-1', md: 'body-2' }}
      color={{ base: 'brand.secondary.700', md: 'brand.secondary.500' }}
      noOfLines={{ base: 0, md: 1 }}
      title={children}
    >
      {children}
    </Text>
  )
}

export const CollaboratorRow = ({
  isLoading,
  email,
  isCurrentUser,
  children,
}: CollaboratorRowProps) => {
  return (
    <Stack
      p={{ base: '1.5rem', md: 0 }}
      w="100%"
      minH="3.5rem"
      direction={{ base: 'column', md: 'row' }}
      justify="space-between"
      align={{ base: 'flex-start', md: 'center' }}
      spacing={{ base: '0.75rem', md: '2rem' }}
      _odd={{ bg: { base: 'white', md: undefined } }}
      _even={{ bg: { base: 'brand.primary.50', md: undefined } }}
    >
      <Skeleton
        isLoaded={!isLoading}
        flex={1}
        w="100%"
        // Required to allow flex to shrink
        minW={0}
      >
        <Stack direction="row" align="baseline" flex={1}>
          <CollaboratorText>{email}</CollaboratorText>
          {isCurrentUser ? (
            <Text as="span" textStyle="caption-1" color="neutral.600">
              (You)
            </Text>
          ) : null}
        </Stack>
      </Skeleton>
      <Skeleton isLoaded={!isLoading} w="100%" flex={0}>
        {children}
      </Skeleton>
    </Stack>
  )
}
