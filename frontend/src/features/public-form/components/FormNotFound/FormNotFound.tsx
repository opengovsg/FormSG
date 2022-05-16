import { Flex, Stack, Text } from '@chakra-ui/react'

import { FormFooter } from '../FormFooter'

import { FormNotFoundSvgr } from './FormNotFoundSvgr'

interface FormNotFoundProps {
  message?: string
}

export const FormNotFound = ({ message }: FormNotFoundProps): JSX.Element => {
  return (
    <Flex
      justify="center"
      flexDir="column"
      flex={1}
      bgGradient="linear(to-b, primary.500 50%, primary.100 50%)"
    >
      <Flex
        flex={1}
        justify="center"
        align="center"
        flexDir="column"
        mt="3rem"
        p="1.5rem"
      >
        <FormNotFoundSvgr maxW="100%" mb="3rem" />
        <Stack
          spacing="1rem"
          color="secondary.500"
          align="center"
          textAlign="center"
        >
          <Text as="h2" textStyle="h2">
            This form is not available.
          </Text>
          <Text textStyle="body-1">{message}</Text>
        </Stack>
      </Flex>
      <FormFooter />
    </Flex>
  )
}
