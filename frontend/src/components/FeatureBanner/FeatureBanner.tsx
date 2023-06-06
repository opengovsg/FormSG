import {
  Box,
  Center,
  Flex,
  Text,
  useMultiStyleConfig,
  VStack,
} from '@chakra-ui/react'

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
  bannerColorIntensity = 500,
  title,
  body,
  learnMoreLink,
}: FeatureBannerProps): JSX.Element => {
  const styles = useMultiStyleConfig('Banner', { variant })

  return (
    <Box __css={styles.banner} bgColor={`primary.${bannerColorIntensity}`}>
      <Flex
        sx={styles.item}
        placeContent={title ? undefined : 'center'}
        mx="2rem"
        my={title ? '0.5rem' : 'auto'}
      >
        <VStack mr="1.5rem" alignItems="flex-start">
          <Text as="h5" textStyle="h5">
            {title}
          </Text>
          <Text as="h6" textStyle="h6">
            {body}
          </Text>
        </VStack>
        <Center>
          <Button
            sx={{
              ...styles.button,
              ...(title ? textStyles['subhead-1'] : textStyles['subhead-2']),
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
            verticalAlign="middle"
          >
            Learn more
          </Button>
        </Center>
      </Flex>
    </Box>
  )
}
