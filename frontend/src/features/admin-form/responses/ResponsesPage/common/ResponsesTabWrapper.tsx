import { Box } from '@chakra-ui/react'

export const ResponsesTabWrapper = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  return (
    <Box overflowY="hidden">
      <Box
        pb={{ base: '1.5rem', md: '3rem' }}
        flex={1}
        display="flex"
        flexDir="column"
        color="secondary.500"
      >
        {children}
      </Box>
    </Box>
  )
}
