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
import { GovtMastheadItem } from './GovtMastheadItem'

export const GovtMasthead = (): JSX.Element => {
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
      >
        <GovtMastheadIcon
          fontSize="1rem"
          mr={{ base: '0.25rem', lg: '0.5rem' }}
          my={{ base: '0px', md: '2px' }}
        />
        <Flex alignItems="center" flexWrap="wrap">
          <Text my="2px">A Singapore government agency website.&nbsp;</Text>
          <Link
            tabIndex={0}
            aria-label="Click to expand masthead for more information"
          >
            How to identify
            <Icon
              as={isOpen ? BiChevronUp : BiChevronDown}
              fontSize={{ base: '1rem', md: '1.25rem' }}
            />
          </Link>
        </Flex>
      </chakra.button>

      <Collapse in={isOpen} animateOpacity>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={{ base: '1rem', md: '4.5rem', lg: '9.5rem' }}
          bg="neutral.200"
          px="2rem"
          py={{ base: '1.5rem', md: '2.25rem', lg: '2.75rem' }}
          textStyle={{ base: 'caption-2', lg: 'body-1' }}
        >
          <GovtMastheadItem
            icon={BxsBank}
            header="Official website links end with .gov.sg"
          >
            Government agencies communicate via <b>.gov.sg</b> websites(e.g.
            go.gov.sg/open).{' '}
            <Link href="https://go.gov.sg/trusted-sites" isExternal>
              Trusted websites
            </Link>
          </GovtMastheadItem>
          <GovtMastheadItem
            icon={BxsLockAlt}
            header="Secure websites use HTTPS"
          >
            Look for a lock (
            <Icon as={BxsLockAlt} fontSize={{ base: '0.75rem', lg: '1rem' }} />)
            or https:// as an added precaution.
            <br></br>Share sensitive information only on official, secure
            websites.
          </GovtMastheadItem>
        </Stack>
      </Collapse>
    </Box>
  )
}
