import { Box, Stack, StackDivider, Text } from '@chakra-ui/react'

export const FieldSection = ({
  label,
  children,
}: {
  label?: string
  children: React.ReactNode
}) => {
  return (
    <Box mb="0.5rem">
      {label ? (
        <Text
          px="1.5rem"
          pt="1rem"
          pb="0.75rem"
          textStyle="subhead-2"
          color="brand.secondary.500"
          pos="sticky"
          top={0}
          bg="white"
          zIndex="docked"
        >
          {label}
        </Text>
      ) : null}
      <Stack divider={<StackDivider />} spacing={0}>
        {children}
      </Stack>
    </Box>
  )
}
