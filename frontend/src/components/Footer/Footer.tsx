import {
  Box,
  chakra,
  Divider,
  Flex,
  FlexProps,
  Link,
  Stack,
  Text,
  Wrap,
} from '@chakra-ui/react'

import { ThemeColorScheme } from '~/theme/foundations/colours'

import { BxlFacebook } from '~assets/icons/BxlFacebook'
import { BxlInstagram } from '~assets/icons/BxlInstagram'
import { BxlLinkedin } from '~assets/icons/BxlLinkedin'
import { ReactComponent as OgpLogoFullSvg } from '~assets/svgs/brand/ogp-logo-full.svg'

const OgpLogoFull = chakra(OgpLogoFullSvg)

const DEFAULT_FOOTER_ICON_LINK: FooterLinkWithIcon = {
  href: 'https://open.gov.sg',
  label: 'Open Government Products homepage',
  icon: <OgpLogoFull w="183px" />,
}

const DEFAULT_SOCIAL_MEDIA_LINKS: FooterLinkWithIcon[] = [
  {
    href: 'https://sg.linkedin.com/company/open-government-products',

    icon: <BxlLinkedin />,
    label: 'Go to our LinkedIn page',
  },
  {
    href: 'https://www.facebook.com/opengovsg',
    icon: <BxlFacebook />,
    label: 'Go to our Facebook page',
  },
  {
    href: 'https://www.instagram.com/opengovsg',
    icon: <BxlInstagram />,
    label: 'Go to our Instagram page',
  },
]

type FooterLinkWithIcon = FooterLink & {
  icon: React.ReactElement
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
  /** Link for footer icon. Defaults to OGP homepage. */
  footerIconLink?: FooterLinkWithIcon
  /** Footer links to display, if provided. */
  footerLinks?: FooterLink[]
  /** Social media links to display, if provided. Defaults to OGP links. */
  socialMediaLinks?: FooterLinkWithIcon[]
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
  footerIconLink = DEFAULT_FOOTER_ICON_LINK,
  socialMediaLinks = DEFAULT_SOCIAL_MEDIA_LINKS,
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
              isExternal
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
            isExternal
            title={footerIconLink.label}
            colorScheme={textColorScheme}
            mb="2rem"
            href={footerIconLink.href}
          >
            {footerIconLink.icon}
          </Link>
        </Box>

        <Box>
          <Stack
            spacing="1rem"
            direction="row"
            mt="2rem"
            mb="0.5rem"
            justify={{ base: 'normal', lg: 'flex-end' }}
          >
            {socialMediaLinks?.map(({ label, href, icon }) => (
              <Link
                isExternal
                title={label}
                w="2rem"
                href={href}
                colorScheme={textColorScheme}
              >
                {icon}
              </Link>
            ))}
          </Stack>
          <Text textStyle="legal" color={`${textColorScheme}.500`}>
            ©{currentYear} Open Government Products
          </Text>
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
