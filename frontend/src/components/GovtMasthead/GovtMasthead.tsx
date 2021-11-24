import React from 'react'
import { BiChevronDown, BiChevronUp } from 'react-icons/bi'
import {
  Box,
  chakra,
  Collapse,
  Flex,
  Icon,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import { BxsBank } from '~assets/icons/BxsBank'
import { BxsLockAlt } from '~assets/icons/BxsLockAlt'
import Link from '~components/Link'

import { GovtMastheadIcon } from './GovtMastheadIcon'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GovtMastheadProps {}

export const GovtMasthead = ({}: GovtMastheadProps): JSX.Element => {
  const { isOpen, onToggle } = useDisclosure()

  return (
    <Box>
      <chakra.button
        bg="neutral.200"
        py={{ base: '0.5rem', md: '0.375rem' }}
        px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
        textStyle={{ base: 'legal', md: 'caption-2' }}
        onClick={onToggle}
        display="flex"
        width="100%"
        _focus={{ bg: 'red' }}
      >
        <GovtMastheadIcon
          fontSize="1rem"
          mr={{ base: '0.25rem', lg: '0.5rem' }}
          my={{ base: '0px', md: '2px' }}
        />
        <Flex alignItems="center" flexWrap="wrap">
          <Text my="2px">A Singapore government agency website.&nbsp;</Text>
          <Link>
            How to identify{' '}
            {isOpen ? (
              <Icon
                as={BiChevronUp}
                fontSize={{ base: '1rem', md: '1.25rem' }}
              />
            ) : (
              <Icon
                as={BiChevronDown}
                fontSize={{ base: '1rem', md: '1.25rem' }}
              />
            )}
          </Link>
        </Flex>
      </chakra.button>

      <Collapse in={isOpen} animateOpacity>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={{ md: '4.5rem', lg: '9.5rem' }}
          bg="neutral.200"
          px="2rem"
          py={{ base: '1.5rem', md: '2.25rem', lg: '2.75rem' }}
          textStyle={{ base: 'caption-2', lg: 'body-1' }}
        >
          <Flex flex={1} maxW="32rem">
            <Icon
              as={BxsBank}
              fontSize={{ base: '1rem', lg: '1.5rem' }}
              mr={{ base: '0.5rem', lg: '0.75rem' }}
            />
            <Flex flexDir="column">
              <Text
                textStyle={{ base: 'caption-1', lg: 'subhead-1' }}
                mb="0.75rem"
              >
                Official website links end with .gov.sg
              </Text>
              <Text>
                Government agencies communicate via <b>.gov.sg</b> websites(e.g.
                go.gov.sg/open).{' '}
                <Link href="https://go.gov.sg/trusted-sites" isExternal>
                  Trusted websites
                </Link>
              </Text>
            </Flex>
          </Flex>
          <Flex flex={1}>
            <Icon
              as={BxsLockAlt}
              fontSize={{ base: '1rem', lg: '1.5rem' }}
              mr={{ base: '0.5rem', lg: '0.75rem' }}
            />
            <Flex flexDir="column">
              <Text
                textStyle={{ base: 'caption-1', lg: 'subhead-1' }}
                mb="0.75rem"
              >
                Secure websites use HTTPS
              </Text>
              <Text>
                Look for a lock (
                <Icon
                  as={BxsLockAlt}
                  fontSize={{ base: '0.75rem', lg: '1rem' }}
                />
                ) or https:// as an added precaution.
                <br></br>Share sensitive information only on official, secure
                websites.
              </Text>
            </Flex>
          </Flex>
        </Stack>
      </Collapse>
    </Box>
  )
}
