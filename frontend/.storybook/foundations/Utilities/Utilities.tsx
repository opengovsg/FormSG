import { FC } from 'react'
import {
  Box,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
  Wrap,
} from '@chakra-ui/layout'

export const Utilities = (): JSX.Element => {
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
        <Flex flexDir={{ base: 'column', md: 'row' }} align="center">
          <Text
            color="secondary.400"
            textStyle="subhead-3"
            mr="10rem"
            whiteSpace="nowrap"
          >
            shadow-sm
          </Text>
          <Box h="3.5rem" w="100%" shadow="sm"></Box>
        </Flex>
        <Flex flexDir={{ base: 'column', md: 'row' }} align="center">
          <Text
            color="secondary.400"
            textStyle="subhead-3"
            mr="10rem"
            whiteSpace="nowrap"
          >
            shadow-md
          </Text>
          <Box h="3.5rem" w="100%" shadow="md"></Box>
        </Flex>
        <Flex flexDir={{ base: 'column', md: 'row' }} align="center">
          <Text
            color="secondary.400"
            textStyle="subhead-3"
            mr="10rem"
            whiteSpace="nowrap"
          >
            shadow-lg
          </Text>
          <Box h="3.5rem" w="100%" shadow="lg"></Box>
        </Flex>
      </Stack>
    </Container>
  )
}
