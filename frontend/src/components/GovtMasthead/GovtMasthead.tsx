import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { BiChevronDown, BiChevronUp, BiSolidErrorCircle } from 'react-icons/bi'
import {
  Box,
  chakra,
  Collapse,
  Flex,
  Icon,
  Stack,
  Text,
  useDisclosure,
  VisuallyHidden,
} from '@chakra-ui/react'

import { BxsBank } from '~assets/icons/BxsBank'
import { BxsLockAlt } from '~assets/icons/BxsLockAlt'
import { useIsMobile } from '~hooks/useIsMobile'
import Link from '~components/Link'

import { GovtMastheadIcon } from './GovtMastheadIcon'
import { GovtMastheadItem } from './GovtMastheadItem'

export interface GovtMastheadProps {
  defaultIsOpen?: boolean
}

interface GovtMastheadChildrenProps {
  isOpen: boolean
  isMobile: boolean
  onToggle: () => void
  children: React.ReactNode
}

interface HeaderBarProps extends GovtMastheadChildrenProps {
  /**
   * ID of the expandable section for accessibility.
   */
  ariaControlId: string
}

const HeaderBar = ({
  isMobile,
  children,
  onToggle,
  isOpen,
  ariaControlId,
}: HeaderBarProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'components.govtMasthead',
  })

  const styleProps = {
    bg: 'neutral.200',
    py: { base: '0.5rem', md: '0.375rem' },
    px: { base: '1.5rem', md: '1.75rem', lg: '2rem' },
    textStyle: { base: 'legal', md: 'caption-2' },
    display: 'flex',
    width: '100%',
  }

  // Mobile
  if (isMobile) {
    return (
      <chakra.button
        aria-controls={ariaControlId}
        aria-describedby="masthead-aria"
        aria-expanded={isOpen}
        _focus={{
          boxShadow: '0 0 0 2px inset var(--chakra-colors-primary-500)',
        }}
        {...styleProps}
        onClick={onToggle}
      >
        <VisuallyHidden id="masthead-aria">
          {isOpen ? t('aria.collapseLabel') : t('aria.expandLabel')}
        </VisuallyHidden>
        {children}
      </chakra.button>
    )
  }

  // Non-mobile
  return <Flex {...styleProps}>{children}</Flex>
}

const HowToIdentify = ({
  isOpen,
  isMobile,
  children,
  onToggle,
}: GovtMastheadChildrenProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'components.govtMasthead',
  })

  // Mobile
  if (isMobile) {
    return (
      <Text
        aria-hidden
        as="span"
        color="primary.500"
        textDecorationLine="underline"
      >
        {t('howToIdentify')}
      </Text>
    )
  }

  // Non-mobile
  return (
    <Link
      as="button"
      tabIndex={0}
      aria-label={isOpen ? t('aria.collapseLabel') : t('aria.expandLabel')}
      onClick={onToggle}
    >
      {t('howToIdentify')} {children}
    </Link>
  )
}

export const GovtMasthead = ({
  defaultIsOpen,
}: GovtMastheadProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'components.govtMasthead',
  })
  const { onToggle, isOpen } = useDisclosure({ defaultIsOpen })
  const isMobile = useIsMobile()

  const ariaControlId = 'govt-masthead-expandable'

  return (
    <Box>
      <HeaderBar
        onToggle={onToggle}
        isMobile={isMobile}
        isOpen={isOpen}
        ariaControlId={ariaControlId}
      >
        <GovtMastheadIcon
          aria-hidden
          fontSize="1rem"
          mr={{ base: '0.25rem', lg: '0.5rem' }}
          my={{ base: '0px', md: '2px' }}
          flexShrink={0}
        />
        <Flex alignItems="center" flexWrap="wrap">
          <Box>
            <Text as="span">{t('mainText')}&ensp;</Text>
            <HowToIdentify
              isOpen={isOpen}
              onToggle={onToggle}
              isMobile={isMobile}
            >
              <Icon
                aria-hidden
                as={isOpen ? BiChevronUp : BiChevronDown}
                fontSize={{ base: '1rem', md: '1.25rem' }}
              />
            </HowToIdentify>
          </Box>
        </Flex>
        {isMobile && (
          <Flex align="center">
            <Icon
              aria-hidden
              as={isOpen ? BiChevronUp : BiChevronDown}
              color="primary.500"
              fontSize={{ base: '1rem', md: '1.25rem' }}
              mt="1px" // Adjust for vertical alignment
              mb="-1px" // Adjust for vertical alignment
            />
          </Flex>
        )}
      </HeaderBar>

      <Collapse in={isOpen} animateOpacity>
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={{ base: '1rem' }}
          bg="neutral.200"
          px="2rem"
          py={{ base: '1.5rem', md: '2.25rem', lg: '2.75rem' }}
          textStyle={{ base: 'caption-2', lg: 'body-1' }}
          id={ariaControlId}
          aria-hidden={!isOpen}
        >
          <GovtMastheadItem
            icon={BxsBank}
            header={t('officialWebsiteLinks.header')}
          >
            <Box textStyle={{ base: 'caption-2', md: 'body-1' }}>
              <Trans
                i18nKey="components.govtMasthead.officialWebsiteLinks.description"
                components={{
                  bold: <Text as="b" />,
                }}
              />{' '}
              <Link
                aria-label={t(
                  'officialWebsiteLinks.trustedWebsitesLink.ariaLabel',
                )}
                href="https://go.gov.sg/trusted-sites"
                isExternal
              >
                {t('officialWebsiteLinks.trustedWebsitesLink.text')}
              </Link>
            </Box>
          </GovtMastheadItem>
          <GovtMastheadItem
            icon={BxsLockAlt}
            header={t('secureWebsites.header')}
          >
            <Box textStyle={{ base: 'caption-2', md: 'body-1' }}>
              <Text as="span">Look for a lock (</Text>
              <Icon
                aria-hidden
                as={BxsLockAlt}
                height={{ base: '1rem', md: '1.5rem' }}
                verticalAlign="bottom"
              />
              <Text as="span">) {t('secureWebsites.description')}</Text>
            </Box>
          </GovtMastheadItem>
          <GovtMastheadItem
            icon={BiSolidErrorCircle}
            header={t('scamAlert.header')}
          >
            <Box textStyle={{ base: 'caption-2', md: 'body-1' }}>
              <Trans
                i18nKey="components.govtMasthead.scamAlert.description"
                components={{
                  bold: <Text as="b" />,
                }}
              />
            </Box>
          </GovtMastheadItem>
        </Stack>
      </Collapse>
    </Box>
  )
}
