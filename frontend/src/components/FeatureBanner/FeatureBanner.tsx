import {
  Box,
  BoxProps,
  Flex,
  Stack,
  Text,
  ThemingProps,
  useMultiStyleConfig,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'

import { FeatureBannerStylesProvider } from './FeatureBannerContext'
import { LearnMoreButton } from './LearnMoreButton'

export interface FeatureBannerProps extends BoxProps {
  variant?: ThemingProps<'Banner'>['variant']
  title?: string
  body: string
  learnMoreLink: string // Could be link to an external or internal page
}

export const FeatureBanner = ({
  variant = 'info',
  title,
  body,
  learnMoreLink,
  ...boxProps
}: FeatureBannerProps): JSX.Element => {
  const styles = useMultiStyleConfig('Banner', { variant })

  return (
    <FeatureBannerStylesProvider value={styles}>
      <Box py="1.5rem" __css={styles.banner} {...boxProps}>
        <Flex __css={styles.item} justifyContent="center">
          <Wrap spacing="1.5rem" align={title ? 'flex-start' : undefined}>
            <WrapItem alignItems="center">
              <Stack spacing="0.25rem">
                {title && <Text textStyle="h5">{title}</Text>}
                <Text textStyle="h6">{body}</Text>
              </Stack>
            </WrapItem>
            <WrapItem>
              <LearnMoreButton learnMoreLink={learnMoreLink} title={title} />
            </WrapItem>
          </Wrap>
        </Flex>
      </Box>
    </FeatureBannerStylesProvider>
  )
}
