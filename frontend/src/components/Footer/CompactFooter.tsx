import { chakra, Divider, Flex, Link, Stack, Wrap } from '@chakra-ui/react'

import BrandHortSvg from '~assets/svgs/brand/brand-hort-colour.svg?react'
import BrandHortLightMonoSvg from '~assets/svgs/brand/brand-hort-lightmono.svg?react'

import { FooterContainerProps, FooterVariantProps } from './common/types'

const BrandHortLogo = chakra(BrandHortSvg)
const BrandHortLightMonoLogo = chakra(BrandHortLightMonoSvg)

interface CompactedFooterProps extends FooterVariantProps {
  compactMonochromeLogos?: boolean
}

/** Desktop only compact footer variant */
export const CompactFooter = ({
  footerIconLink,
  textColorScheme,
  footerLinks,
  compactMonochromeLogos,
  appLink,
  containerProps,
}: CompactedFooterProps): JSX.Element => {
  return (
    <CompactFooter.Container {...containerProps}>
      <Stack direction="row" h="2.25rem" align="center" spacing="2rem">
        <Link
          colorScheme={compactMonochromeLogos ? 'white' : textColorScheme}
          isExternal
          title="Link to application homepage"
          href={appLink}
        >
          {compactMonochromeLogos ? (
            <BrandHortLightMonoLogo h="1rem" />
          ) : (
            <BrandHortLogo h="1rem" />
          )}
        </Link>
        <Divider
          orientation="vertical"
          color={compactMonochromeLogos ? 'neutral.300' : undefined}
        />
        <Link
          isExternal
          title={footerIconLink.label}
          colorScheme={compactMonochromeLogos ? 'white' : textColorScheme}
          href={footerIconLink.href}
        >
          <footerIconLink.Icon
            fill={compactMonochromeLogos ? 'white' : undefined}
            height="1.5rem"
          />
        </Link>
      </Stack>
      <Wrap
        flex={1}
        shouldWrapChildren
        textStyle="body-2"
        spacing="1.5rem"
        justify="flex-end"
      >
        {footerLinks?.map(({ label, href }, index) => (
          <Link
            isExternal
            m="-0.25rem"
            key={index}
            variant="standalone"
            w="fit-content"
            href={href}
          >
            {label}
          </Link>
        ))}
      </Wrap>
    </CompactFooter.Container>
  )
}

CompactFooter.Container = ({
  children,
  ...props
}: FooterContainerProps): JSX.Element => {
  return (
    <Flex
      align="center"
      width="100%"
      justify="space-between"
      flexDir="row"
      as="footer"
      {...props}
    >
      {children}
    </Flex>
  )
}
