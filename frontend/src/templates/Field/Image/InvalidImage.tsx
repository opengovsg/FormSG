import { BiImage } from 'react-icons/bi'
import { Box, Icon, Stack, Text } from '@chakra-ui/react'

export interface InvalidImageProps {
  message: string
}

export const InvalidImage = ({ message }: InvalidImageProps): JSX.Element => {
  return (
    <Box bg="grey.100" p="2rem">
      <Stack spacing="1rem" justify="center" align="center">
        <Icon as={BiImage} size="1.5rem" color="brand.secondary.500" />
        <Text
          textStyle="caption-1"
          color="brand.secondary.400"
          whiteSpace="pre-wrap"
          textAlign="center"
        >
          {message}
        </Text>
      </Stack>
    </Box>
  )
}
