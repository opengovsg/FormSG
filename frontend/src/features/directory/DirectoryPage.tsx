import { useMemo } from 'react'
import { Box, Flex } from '@chakra-ui/react'

import { AppFooter } from '~/app/AppFooter'

import { getBannerProps } from '~utils/getBannerProps'
import { Banner } from '~components/Banner'

import { useEnv } from '~features/env/queries'

import { DirectoryPageContent } from './DirectoryPageContent'

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
    <Flex flexDir="column" bg="neutral.100" h="100%">
      {bannerProps ? (
        <Banner useMarkdown variant={bannerProps.variant}>
          {bannerProps.msg}
        </Banner>
      ) : null}
      <DirectoryPageContent />
      <Box bgColor="primary.100">
        <AppFooter />
      </Box>
    </Flex>
  )
}
