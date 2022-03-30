// eslint-disable-next-line @typescript-eslint/no-empty-interface
import { chakra, Flex, FlexProps, HStack } from '@chakra-ui/react'

import { ThemeColorScheme } from '~/theme/foundations/colours'

import { ReactComponent as BrandHortSvg } from '~assets/svgs/brand/brand-hort-colour.svg'
import { ReactComponent as BrandMarkSvg } from '~assets/svgs/brand/brand-mark-colour.svg'
import Button from '~components/Button'
import Link from '~components/Link'

const BrandHortLogo = chakra(BrandHortSvg)
const BrandSmallLogo = chakra(BrandMarkSvg)

type PublicHeaderLink = {
  label: string
  href: string
  showOnMobile?: boolean
}

export interface PublicHeaderProps {
  /** Footer links to display, if provided. */
  publicHeaderLinks?: PublicHeaderLink[]
}

export const PublicHeader = ({
  publicHeaderLinks,
}: PublicHeaderProps): JSX.Element => {
  return (
    <PublicHeader.Container>
      <Link title="Form Logo" href="https://form.gov.sg/">
        <BrandSmallLogo display={{ base: 'block', sm: 'none' }} w="40px" />
        <BrandHortLogo display={{ base: 'none', sm: 'block' }} w="124.25px" />
      </Link>
      <HStack>
        <HStack
          paddingEnd={{ base: '1.5rem', md: '2rem', xl: '2.5rem' }}
          spacing={{ base: '1.5rem', md: '2rem', xl: '2.5rem' }}
          textStyle="subhead-1"
        >
          {publicHeaderLinks?.map(({ label, href, showOnMobile }, index) => (
            <Link
              display={{ base: showOnMobile ? 'block' : 'none', md: 'block' }}
              w="fit-content"
              variant="standalone"
              color="primary.500"
              key={index}
              href={href}
            >
              {label}
            </Link>
          ))}
        </HStack>
        <Button variant="solid" colorScheme="primary" size="small">
          Log In
        </Button>
      </HStack>
    </PublicHeader.Container>
  )
}

interface PublicHeaderContainerProps extends FlexProps {
  children: React.ReactNode
}

PublicHeader.Container = ({
  children,
  ...props
}: PublicHeaderContainerProps): JSX.Element => {
  return (
    <Flex
      justify="space-between"
      align="center"
      px={{ base: '1.5rem', sm: '5.5rem', xl: '9.25rem' }}
      py={{ base: '0.625rem', sm: '5.5rem', xl: '5.5rem' }}
      bg="primary.100"
      {...props}
    >
      {children}
    </Flex>
  )
}
