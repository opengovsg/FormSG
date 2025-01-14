import {
  As,
  chakra,
  Flex,
  FlexProps,
  HStack,
  Icon,
  useBreakpointValue,
} from '@chakra-ui/react'

import BrandHortSvg from '~assets/svgs/brand/brand-hort-colour.svg?react'
import BrandHortDarkSvg from '~assets/svgs/brand/brand-hort-dark.svg?react'
import BrandMarkSvg from '~assets/svgs/brand/brand-mark-colour.svg?react'
import BrandMarkDarkSvg from '~assets/svgs/brand/brand-mark-dark.svg?react'
import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'
import Link from '~components/Link'

type PublicHeaderLinkProps = {
  label: string
  href: string
  showOnMobile?: boolean
  MobileIcon: As
  bg?: string
}

export interface PublicHeaderProps {
  /** Header links to display, if provided. */
  publicHeaderLinks?: PublicHeaderLinkProps[]
  /** Call to action element to render, if any. */
  ctaElement?: React.ReactNode
  /** Background colour to use for the header, if specified. */
  bg?: string
}

const PublicHeaderLink = ({
  showOnMobile,
  MobileIcon,
  href,
  label,
  bg,
}: PublicHeaderLinkProps) => {
  const isMobile = useIsMobile()

  if (isMobile && !showOnMobile) {
    return null
  }

  if (isMobile && MobileIcon) {
    return (
      <IconButton
        variant="clear"
        as="a"
        href={href}
        aria-label={label}
        icon={<Icon as={MobileIcon} fontSize="1.25rem" color="primary.500" />}
      />
    )
  }

  return (
    <Link
      w="fit-content"
      variant="standalone"
      color={bg ? 'white' : 'primary.500'}
      href={href}
      aria-label={label}
      _hover={{
        color: bg ? 'white' : 'primary.600',
        textDecoration: 'underline',
      }}
    >
      {label}
    </Link>
  )
}

export const PublicHeader = ({
  publicHeaderLinks,
  ctaElement: ctaButton,
  bg,
}: PublicHeaderProps): JSX.Element => {
  const BrandHortLogo = bg ? chakra(BrandHortDarkSvg) : chakra(BrandHortSvg)
  const BrandSmallLogo = bg ? chakra(BrandMarkDarkSvg) : chakra(BrandMarkSvg)

  const logoToRender = useBreakpointValue({
    base: <BrandSmallLogo w="2.5rem" />,
    sm: <BrandHortLogo w="7.75rem" />,
  })

  return (
    <PublicHeader.Container bg={bg}>
      <Link title="Form Logo" href="https://form.gov.sg/">
        {logoToRender}
      </Link>
      <HStack
        textStyle="subhead-1"
        spacing={{ base: '1rem', md: '2rem', xl: '2.5rem' }}
      >
        {publicHeaderLinks?.map((link, index) => (
          <PublicHeaderLink key={index} bg={bg} {...link} />
        ))}
        {ctaButton ?? null}
      </HStack>
    </PublicHeader.Container>
  )
}

interface PublicHeaderContainerProps extends FlexProps {
  children: React.ReactNode
}

PublicHeader.Container = ({
  children,
  bg,
  ...props
}: PublicHeaderContainerProps): JSX.Element => {
  return (
    <Flex
      justify="space-between"
      align="center"
      px={{ base: '1.5rem', md: '5.5rem', lg: '9.25rem' }}
      py={{ base: '0.625rem', md: '4.5rem' }}
      {...props}
      bg={bg ? bg : 'primary.100'}
    >
      {children}
    </Flex>
  )
}
