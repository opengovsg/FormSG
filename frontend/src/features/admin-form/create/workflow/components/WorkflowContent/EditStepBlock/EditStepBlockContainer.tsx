import { Stack } from '@chakra-ui/react'

export const EditStepBlockContainer = ({
  children,
}: {
  children?: React.ReactNode
}): JSX.Element => {
  return (
    <Stack
      direction="column"
      spacing="0.75rem"
      px={{ base: '1.5rem', md: '2rem' }}
      borderTopColor="secondary.200"
    >
      {children}
    </Stack>
  )
}
