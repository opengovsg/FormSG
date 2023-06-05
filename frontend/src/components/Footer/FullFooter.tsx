import { Box, Divider, Flex, Link, Stack, Text, Wrap } from '@chakra-ui/react'

import {
  DEFAULT_FOOTER_ICON_LINK,
  DEFAULT_SOCIAL_MEDIA_LINKS,
} from './common/constants'
import { FooterContainerProps, FooterVariantProps } from './common/types'

export const FullFooter = ({
  appName,
  appLink,
  tagline,
  footerLinks,
  footerIconLink = DEFAULT_FOOTER_ICON_LINK,
  socialMediaLinks = DEFAULT_SOCIAL_MEDIA_LINKS,
  textColorScheme = 'secondary',
  containerProps,
}: FooterVariantProps): JSX.Element => {
  const currentYear = new Date().getFullYear()

  return (
    <FullFooter.Container {...containerProps}>
      <FullFooter.Section>
        <Stack
          flex={1}
          direction={{ base: 'column', lg: 'row' }}
          spacing={{ base: 0, lg: '1rem' }}
          paddingBottom={{ base: '1.5rem', lg: 0 }}
          paddingEnd={{ base: 0, lg: '1.5rem' }}
          align="baseline"
        >
          <Link
            colorScheme={textColorScheme}
            variant="standalone"
            m="-0.25rem"
            isExternal
            href={appLink}
          >
            <Text textStyle="h4">{appName}</Text>
          </Link>
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
      </FullFooter.Section>
      <Divider my="1.5rem" />
      <FullFooter.Section>
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
            <footerIconLink.Icon width="183px"></footerIconLink.Icon>
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
            {socialMediaLinks?.map(({ label, href, Icon }, index) => (
              <Link
                key={index}
                isExternal
                title={label}
                w="2rem"
                href={href}
                colorScheme={textColorScheme}
              >
                <Icon />
              </Link>
            ))}
          </Stack>
          <Text textStyle="legal" color={`${textColorScheme}.500`}>
            ©{currentYear} Open Government Products
          </Text>
        </Box>
      </FullFooter.Section>
    </FullFooter.Container>
  )
}

FullFooter.Container = ({
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

FullFooter.Section = ({
  children,
  ...props
}: FooterContainerProps): JSX.Element => {
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
