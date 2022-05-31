import { Container } from '@chakra-ui/react'

export const ResponsesTabWrapper = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  return (
    <Container
      overflowY="auto"
      p={{ base: '1.5rem', md: '3rem' }}
      maxW="69.5rem"
      flex={1}
      display="flex"
      flexDir="column"
      color="secondary.500"
    >
      {children}
    </Container>
  )
}
