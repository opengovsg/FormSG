import { FC } from 'react'
import { Flex, Image, Wrap, WrapProps } from '@chakra-ui/react'

import { LandingSection } from './LandingSection'
import { SectionTitleText } from './SectionTitleText'

interface FeatureSectionProps extends WrapProps {
  title: string
  imgSrc?: string
}

export const FeatureSection: FC<FeatureSectionProps> = ({
  children,
  imgSrc,
  title,
  direction = 'row',
  align = 'center',
  bg,
  ...wrapProps
}) => {
  return (
    <LandingSection bg={bg}>
      <Wrap
        spacingX="8.25rem"
        direction={direction}
        align={align}
        {...wrapProps}
      >
        <Flex flexDir="column" flex={1}>
          <SectionTitleText>{title}</SectionTitleText>
          {children}
        </Flex>
        {imgSrc ? (
          <Image maxW="fit-content" flex={1} src={imgSrc} aria-hidden />
        ) : null}
      </Wrap>
    </LandingSection>
  )
}
