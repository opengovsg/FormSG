import { FC } from 'react'
import { Box, Flex, Image, Stack, StackProps } from '@chakra-ui/react'

import { LottieAnimation } from '~templates/LottieAnimation'

import { LandingSection } from './LandingSection'
import { SectionTitleText } from './SectionTitleText'

interface FeatureSectionProps extends StackProps {
  title: string
  imgSrc?: string
  animationSrc?: unknown
}

export const FeatureSection: FC<FeatureSectionProps> = ({
  children,
  imgSrc,
  animationSrc,
  title,
  direction = 'row',
  align = 'center',
  bg,
  ...wrapProps
}) => {
  return (
    <LandingSection bg={bg}>
      <Stack
        spacing={{ base: '2.5rem', lg: '8.25rem' }}
        direction={direction}
        align={align}
        {...wrapProps}
      >
        <Flex flexDir="column" flex={1}>
          <SectionTitleText>{title}</SectionTitleText>
          {children}
        </Flex>
        {imgSrc ? (
          <Box flex={1} aria-hidden>
            <Image src={imgSrc} />
          </Box>
        ) : null}
        {animationSrc ? (
          <Box flex={1} aria-hidden>
            <LottieAnimation
              animationData={animationSrc}
              preserveAspectRatio="xMidYMax slice"
            />
          </Box>
        ) : null}
      </Stack>
    </LandingSection>
  )
}
