import {
  Box,
  chakra,
  Divider,
  Flex,
  FlexProps,
  Stack,
  Text,
  Wrap,
} from '@chakra-ui/react'

import { ThemeColorScheme } from '~/theme/foundations/colours'

import { BxlFacebook } from '~assets/icons/BxlFacebook'
import { BxlInstagram } from '~assets/icons/BxlInstagram'
import { BxlLinkedin } from '~assets/icons/BxlLinkedin'
import { BxlYoutube } from '~assets/icons/BxlYoutube'
import { ReactComponent as OgpLogoSvg } from '~assets/svgs/brand/ogp-logo.svg'
import { ReactComponent as OgpLogoFullSvg } from '~assets/svgs/brand/ogp-logo-full.svg'
import Link from '~components/Link'

const OgpLogoFull = chakra(OgpLogoFullSvg)
const OgpLogo = chakra(OgpLogoSvg)

const SOCIAL_MEDIA_LINKS = {
  facebook: 'https://www.facebook.com/opengovsg',
  ogp: 'https://www.open.gov.sg/',
  linkedin: 'https://sg.linkedin.com/company/open-government-products',
  youtube: 'https://www.youtube.com/channel/UCuyiflEmkfLfIwOuuN5hAfg',
  instagram: 'https://www.instagram.com/opengovsg/',
}

type FooterLink = {
  label: string
  href: string
}

export interface FooterProps {
  /** Application name to display in footer. */
  appName: string
  /** Tagline to display beside application name, if provided. */
  tagline?: string
  /** Footer links to display, if provided. */
  footerLinks?: FooterLink[]
  /**
   * Colour scheme of the text in the footer.
   * Defaults to `secondary` if not provided.
   */
  textColorScheme?: ThemeColorScheme
  /**
   * Background color of footer.
   * Defaults to `primary.100` if not provided.
   */
  bg?: string
}

export const Footer = ({
  appName,
  tagline,
  footerLinks,
  textColorScheme = 'secondary',
  bg = 'primary.100',
}: FooterProps): JSX.Element => {
  const currentYear = new Date().getFullYear()

  return (
    <Footer.Container bg={bg}>
      <Footer.Section>
        <Stack
          flex={1}
          direction={{ base: 'column', lg: 'row' }}
          spacing={{ base: 0, lg: '1rem' }}
          paddingBottom={{ base: '1.5rem', lg: 0 }}
          paddingEnd={{ base: 0, lg: '1.5rem' }}
          align="baseline"
        >
          <Text textStyle="h4" color={`${textColorScheme}.500`}>
            {appName}
          </Text>
          <Text textStyle="body-2" color={`${textColorScheme}.500`}>
            {tagline}
          </Text>
        </Stack>
        <Wrap
          flex={1}
          shouldWrapChildren
          textStyle="body-2"
          spacing={{ base: '1rem', lg: '1.25rem' }}
          direction={{ base: 'column', lg: 'row' }}
          justify={{ base: 'normal', lg: 'flex-end' }}
        >
          {footerLinks?.map(({ label, href }, index) => (
            <Link
              m="-0.25rem"
              key={index}
              colorScheme={textColorScheme}
              variant="standalone"
              w="fit-content"
              href={href}
            >
              {label}
            </Link>
          ))}
        </Wrap>
      </Footer.Section>
      <Divider my="1.5rem" />
      <Footer.Section>
        <Box>
          <Text
            textStyle="caption-1"
            color={`${textColorScheme}.500`}
            mb="0.5rem"
          >
            Built by
          </Text>
          <Link
            title="Open Government Products Logo"
            colorScheme={textColorScheme}
            mb="2rem"
            href={SOCIAL_MEDIA_LINKS.ogp}
          >
            <OgpLogoFull w="183px" />
          </Link>
        </Box>

        <Box>
          <Stack
            spacing="1rem"
            direction="row"
            mb="0.5rem"
            justify={{ base: 'normal', lg: 'flex-end' }}
          >
            <Link
              title="link to LinkedIn page"
              w="2rem"
              href={SOCIAL_MEDIA_LINKS.linkedin}
              colorScheme={textColorScheme}
            >
              <BxlLinkedin />
            </Link>
            <Link
              title="link to Facebook page"
              w="2rem"
              href={SOCIAL_MEDIA_LINKS.facebook}
              colorScheme={textColorScheme}
            >
              <BxlFacebook />
            </Link>
            <Link
              title="link to YouTube page"
              w="2rem"
              href={SOCIAL_MEDIA_LINKS.youtube}
              colorScheme={textColorScheme}
            >
              <BxlYoutube />
            </Link>
            <Link
              title="link to Instagram page"
              w="2rem"
              href={SOCIAL_MEDIA_LINKS.instagram}
              colorScheme={textColorScheme}
            >
              <BxlInstagram />
            </Link>
            <Link
              title="link to OGP homepage"
              w="2rem"
              href={SOCIAL_MEDIA_LINKS.ogp}
              colorScheme={textColorScheme}
            >
              <OgpLogo />
            </Link>
          </Stack>
          <Flex
            flexDir={{ base: 'column', md: 'row' }}
            textStyle="legal"
            color={`${textColorScheme}.500`}
          >
            <Text>©{currentYear} Open Government Products,&nbsp;</Text>
            <Text>Government Technology Agency of Singapore</Text>
          </Flex>
        </Box>
      </Footer.Section>
    </Footer.Container>
  )
}

interface FooterContainerProps extends FlexProps {
  children: React.ReactNode
}

Footer.Container = ({
  children,
  ...props
}: FooterContainerProps): JSX.Element => {
  return (
    <Flex
      as="footer"
      flexDirection="column"
      py="3rem"
      px={{ base: '1.5rem', md: '5.5rem', lg: '9.25rem' }}
      {...props}
    >
      {children}
    </Flex>
  )
}

interface FooterSectionProps extends FlexProps {
  children: React.ReactNode
}

Footer.Section = ({ children, ...props }: FooterSectionProps): JSX.Element => {
  return (
    <Flex
      align={{ base: 'normal', lg: 'center' }}
      flex={1}
      justify="space-between"
      flexDir={{ base: 'column', lg: 'row' }}
      {...props}
    >
      {children}
    </Flex>
  )
}
