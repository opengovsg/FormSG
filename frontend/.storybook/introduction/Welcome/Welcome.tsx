import { BiBulb, BiChevronRight, BiWrench } from 'react-icons/bi'
import { Box, Flex, Icon, Text } from '@chakra-ui/react'
import { linkTo } from '@storybook/addon-links'

import { fillMinHeightCss } from '~utils/fillHeightCss'
import Link from '~components/Link'

export const Welcome = (): JSX.Element => {
  return (
    <Flex bg="secondary.700" w="100%" css={fillMinHeightCss} flexDir="column">
      <Box
        px={{ base: '1.5rem', md: '5.5rem', lg: '7.5rem' }}
        py={{ base: '1.5rem', md: '5rem', lg: '6rem' }}
        flex="1 0 auto"
      >
        <Box mb="3rem" color="white">
          <Text textStyle="h1-mobile">Welcome to our</Text>
          <Text textStyle="display-1">Camp 🏕</Text>
        </Box>
        <Box maxW="43.75rem">
          <Text textStyle="body-1" color="white" mb="1rem">
            Camp is the design system for FormSG. It helps us create consistent,
            accessible, highly usable, and delightful experiences for our public
            users. It is a living library and guide, and will evolve according
            to our product and user needs. Browse the stories in the sidebar to
            play with different React components, and see usage examples for
            every component.
          </Text>
          <Flex align="center" color="white">
            <Icon as={BiBulb} aria-hidden mr="0.5rem" fontSize="1.5rem" />
            <Text textStyle="subhead-1">
              Protip: Press '/' and start typing to search for a component
            </Text>
          </Flex>
        </Box>
      </Box>
      <Flex as="footer" flexShrink={0} flexDir={{ base: 'column', md: 'row' }}>
        <Box
          color="white"
          flex={1}
          bg="primary.500"
          px={{ base: '1.5rem', md: '5.5rem', lg: '7.5rem' }}
          py={{ base: '1rem', md: '3.5rem', lg: '5.5rem' }}
        >
          <Link
            textStyle="subhead-1"
            isExternal
            colorScheme="white"
            href="https://form.gov.sg"
          >
            form.gov.sg
          </Link>
          <Text mb="2rem" textStyle="body-1">
            A self service online form builder for public officers in Singapore
          </Text>
          <Flex align="center" color="white">
            <Icon as={BiWrench} aria-hidden mr="0.5rem" fontSize="1.5rem" />
            <Text textStyle="subhead-1">
              Built and maintained by{' '}
              <Link href="https://open.gov.sg" isExternal colorScheme="white">
                Open Government Products
              </Link>
            </Text>
          </Flex>
        </Box>
        <Flex bg="success.500" align="center" justify="center" px="4rem">
          <Link
            as="button"
            onClick={linkTo('Introduction/Guiding principles')}
            aria-label="Next story"
            colorScheme="secondary"
          >
            <BiChevronRight fontSize="4rem" />
          </Link>
        </Flex>
      </Flex>
    </Flex>
  )
}
