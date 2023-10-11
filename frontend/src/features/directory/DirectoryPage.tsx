import { useMemo } from 'react'
import { Container, Flex } from '@chakra-ui/react'

import { fillHeightCss } from '~utils/fillHeightCss'
import { getBannerProps } from '~utils/getBannerProps'
import { Banner } from '~components/Banner'

import { useEnv } from '~features/env/queries'

import { DirectoryPageContent } from './DirectoryPageContent'

export const CONTAINER_MAXW = '69.5rem'

export const DirectoryPage = (): JSX.Element => {
  const { data: { siteBannerContent } = {} } = useEnv()

  const bannerContent = useMemo(
    // Use || instead of ?? so that we fall through even if previous banners are empty string.
    () => siteBannerContent,
    [siteBannerContent],
  )

  const bannerProps = useMemo(
    () => getBannerProps(bannerContent),
    [bannerContent],
  )

  return (
    <Flex direction="column" css={fillHeightCss}>
      {bannerProps ? (
        <Banner useMarkdown variant={bannerProps.variant}>
          {bannerProps.msg}
        </Banner>
      ) : null}
      <Container
        flexDir="column"
        px="2rem"
        py="1rem"
        bg="neutral.100"
        css={fillHeightCss}
        maxW={CONTAINER_MAXW}
      >
        <DirectoryPageContent />
      </Container>
    </Flex>
  )
}
