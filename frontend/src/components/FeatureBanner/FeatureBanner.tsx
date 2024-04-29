import {
  Box,
  Center,
  Flex,
  Text,
  useMultiStyleConfig,
  VStack,
} from '@chakra-ui/react'

import { BannerVariant } from '~theme/components/Banner'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { textStyles } from '../../theme/textStyles'

export interface FeatureBannerProps {
  variant?: BannerVariant
  bannerColorIntensity?: 500 | 600 // Update accordingly if other banner colors are needed
  title?: string
  body: string
  learnMoreLink: string // Could be link to an external or internal page
}

export const FeatureBanner = ({
  variant = 'info',
  bannerColorIntensity = 500,
  title,
  body,
  learnMoreLink,
}: FeatureBannerProps): JSX.Element => {
  const isMobile = useIsMobile()
  const styles = useMultiStyleConfig('Banner', { variant })

  const LearnMoreButton = () => (
    <Button
      sx={{
        ...styles.button,
        ...(title ? textStyles['subhead-1'] : textStyles['subhead-2']),
        minHeight: 'auto',
      }}
      variant="inverseOutline"
      basecolorintensity={bannerColorIntensity}
      as="a"
      href={learnMoreLink}
      target="_blank"
    >
      Learn more
    </Button>
  )

  return (
    <Box __css={styles.banner} bgColor={`primary.${bannerColorIntensity}`}>
      <Flex
        __css={styles.item}
        placeContent={title ? undefined : 'center'}
        mx={isMobile ? '0.5rem' : '2rem'}
        my={title ? (isMobile ? '0.5rem' : '1.5rem') : undefined}
      >
        <VStack
          mr={isMobile ? undefined : '1.5rem'}
          align={title ? 'flex-start' : undefined}
          justifyContent="center"
          spacing="auto"
        >
          {title && (
            <Text as="h5" textStyle="h5" mb="0.25rem">
              {title}
            </Text>
          )}
          <Text as="h6" textStyle="h6" pb={isMobile ? '1.25rem' : undefined}>
            {body}
          </Text>
          {isMobile ? <LearnMoreButton /> : null}
        </VStack>
        {isMobile ? null : (
          <Center>
            <LearnMoreButton />
          </Center>
        )}
      </Flex>
    </Box>
  )
}
