import { Box, Heading } from '@chakra-ui/react'

import { useAuth } from '~contexts/AuthContext'
import Button from '~components/Button'

export const LoginPage = (): JSX.Element => {
  const { login } = useAuth()
  return (
    <Box>
      <Heading>This is a mock login page</Heading>
      <Button onClick={login}>Log in</Button>
    </Box>
  )
}
