import { Box, Text } from '@chakra-ui/layout'
import { FC } from 'react'

export interface WelcomeProps {}

export const Welcome: FC<WelcomeProps> = ({}) => {
  return (
    <Box>
      <Text>Form Design System</Text>
      <Text>Todo: Add readme, add quick links</Text>
    </Box>
  )
}
