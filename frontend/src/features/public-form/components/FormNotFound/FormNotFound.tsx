import { Flex, Stack, Text } from '@chakra-ui/react'

import { FormFooter } from '../FormFooter'

import { FormNotFoundSvgr } from './FormNotFoundSvgr'

interface FormNotFoundProps {
  header?: string
  message?: string
}

export const FormNotFound = ({
  header = 'This form is not available.',
  message,
}: FormNotFoundProps): JSX.Element => {
  return (
    <Flex flex={1} flexDir="column" h="100%">
      <Flex
        justify="center"
        flexDir="column"
        align="center"
        flex={1}
        bgGradient={{
          base: 'linear(to-b, primary.500, primary.500 40%, brand.primary.50 0)',
          md: 'linear(to-b, primary.500 50%, brand.primary.50 50%)',
        }}
        py="3rem"
        px="1.5rem"
      >
        <FormNotFoundSvgr
          maxW="100%"
          mb={{ base: '1.5rem', md: '3rem' }}
          maxH={{ base: '220px', md: 'initial' }}
        />
        <Stack
          spacing="1rem"
          color="secondary.500"
          align="center"
          textAlign="center"
        >
          <Text as="h2" textStyle="h4">
            {header}
          </Text>
          <Text textStyle="body-1">{message}</Text>
        </Stack>
      </Flex>
      <Flex
        bg="brand.primary.50"
        p={{ base: 0, md: '1.5rem' }}
        flex={0}
        justify="center"
      >
        <FormFooter />
      </Flex>
    </Flex>
  )
}
