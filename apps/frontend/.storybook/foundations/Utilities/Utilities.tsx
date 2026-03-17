import { useCallback } from 'react'
import {
  Container,
  Flex,
  Heading,
  Stack,
  Text,
  useTheme,
} from '@chakra-ui/react'

export const Utilities = (): JSX.Element => {
  const theme = useTheme()

  const prettyPrint = useCallback((key: string, value: string) => {
    return (
      <>
        <Text color="secondary.400">{key}:&nbsp;</Text>
        <Text>{value}</Text>
      </>
    )
  }, [])

  return (
    <Container maxW="container.xl">
      <Heading
        mb="2rem"
        fontSize="4rem"
        letterSpacing="-0.022em"
        color="secondary.700"
      >
        Utilities
      </Heading>
      <Heading as="h2" textStyle="display-2" color="primary.500" mb="2.5rem">
        Shadows
      </Heading>
      <Stack spacing="2.5rem">
        <Flex
          flexDir={{ base: 'column', md: 'row' }}
          align={{ base: 'start', md: 'center' }}
        >
          <Text
            color="secondary.400"
            textStyle="subhead-3"
            mr="10rem"
            whiteSpace="nowrap"
          >
            shadow-sm
          </Text>
          <Flex h="3.5rem" w="100%" shadow="sm" align="center" justify="center">
            {prettyPrint('sm', theme.shadows['sm'])}
          </Flex>
        </Flex>
        <Flex
          flexDir={{ base: 'column', md: 'row' }}
          align={{ base: 'start', md: 'center' }}
        >
          <Text
            color="secondary.400"
            textStyle="subhead-3"
            mr="10rem"
            whiteSpace="nowrap"
          >
            shadow-md
          </Text>
          <Flex h="3.5rem" w="100%" shadow="md" align="center" justify="center">
            {prettyPrint('md', theme.shadows['md'])}
          </Flex>
        </Flex>
        <Flex
          flexDir={{ base: 'column', md: 'row' }}
          align={{ base: 'start', md: 'center' }}
        >
          <Text
            color="secondary.400"
            textStyle="subhead-3"
            mr="10rem"
            whiteSpace="nowrap"
          >
            shadow-lg
          </Text>
          <Flex h="3.5rem" w="100%" shadow="lg" align="center" justify="center">
            {prettyPrint('lg', theme.shadows['lg'])}
          </Flex>
        </Flex>
      </Stack>
    </Container>
  )
}
