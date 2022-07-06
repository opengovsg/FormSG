import { Box, Container } from '@chakra-ui/react'

export const ResponsesTabWrapper = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  return (
    <Box overflowY="auto">
      <Container
        px={{ base: '1.5rem', md: '1.25rem' }}
        py={{ base: '1.5rem', md: '3rem' }}
        maxW="69.5rem"
        flex={1}
        display="flex"
        flexDir="column"
        color="secondary.500"
      >
        {children}
      </Container>
    </Box>
  )
}
