import { Box, Center, Flex, Text, useMultiStyleConfig } from '@chakra-ui/react'

import { BannerVariant } from '~theme/components/Banner'
import Button from '~components/Button'

import { textStyles } from '../../theme/textStyles'

export interface FeatureBannerProps {
  variant?: BannerVariant
  bannerColorIntensity?: 500 | 600 // Update accordingly if other banner colors are needed
  title?: string
  body: string
  learnMoreLink: string
}

export const FeatureBanner = ({
  variant = 'info',
  bannerColorIntensity = 600,
  title,
  body,
  learnMoreLink,
}: FeatureBannerProps): JSX.Element => {
  const styles = useMultiStyleConfig('Banner', { variant })

  return (
    <Box __css={styles.banner} bgColor={`primary.${bannerColorIntensity}`}>
      <Flex sx={styles.item} placeContent="center" verticalAlign="middle">
        <Center mr="1.5rem">
          <Text textStyle="h6">{body}</Text>
        </Center>
        <Button
          sx={{
            ...styles.button,
            ...textStyles['subhead-2'],
            minHeight: 'auto',
          }}
          variant="solid"
          as="a"
          href={learnMoreLink}
          target="_blank"
          borderColor="white"
          bg="transparent"
          _hover={{
            color: 'white',
            borderColor: 'white',
            bg: `primary.${bannerColorIntensity - 100}`,
          }}
        >
          Learn more
        </Button>
      </Flex>
    </Box>
  )
}
