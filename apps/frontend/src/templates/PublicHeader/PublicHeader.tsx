import {
  As,
  Flex,
  FlexProps,
  HStack,
  Icon,
  useBreakpointValue,
} from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import IconButton from '~components/IconButton'
import Link from '~components/Link'

import { useBrandAssets } from '~features/brand/useBrandAssets'

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
  /** Overrides for the outer container, e.g. a tighter vertical padding. */
  containerProps?: FlexProps
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
  containerProps,
}: PublicHeaderProps): JSX.Element => {
  const { hortColour, hortDark, markColour, markDark } = useBrandAssets()
  const BrandHortLogo = bg ? hortDark.Svg : hortColour.Svg
  const BrandSmallLogo = bg ? markDark.Svg : markColour.Svg

  const logoToRender = useBreakpointValue({
    base: <BrandSmallLogo w="2.5rem" />,
    sm: <BrandHortLogo w="7.75rem" />,
  })

  return (
    <PublicHeader.Container bg={bg} {...containerProps}>
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
      bg={bg ? bg : 'primary.100'}
      {...props}
    >
      {children}
    </Flex>
  )
}
