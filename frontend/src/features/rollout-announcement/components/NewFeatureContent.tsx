import { Box, Image, ModalBody, ModalHeader, Text } from '@chakra-ui/react'
import { Link } from '@opengovsg/design-system-react'

import { LottieAnimation } from '~templates/LottieAnimation'

import { NewFeature } from './AnnouncementsFeatureList'
import { NewFeatureTag } from './NewFeatureTag'

export const NewFeatureContent = (props: {
  content: NewFeature
}): JSX.Element => {
  const { title, description, image, learnMoreLink } = props.content

  return (
    <>
      <Box borderRadius="0.25rem" bg="brand.primary.50" pt="4.5rem">
        {image?.animationData ? (
          <LottieAnimation
            height={{ base: '30vh', md: 'initial' }}
            animationData={image.animationData}
            preserveAspectRatio="xMidYMax slice"
          />
        ) : (
          <Image width="100%" src={image.url} alt={image.alt} />
        )}
      </Box>
      <ModalHeader>
        <NewFeatureTag />
        <Text mt="0.625rem">{title}</Text>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Text textStyle="body-1" color="brand.secondary.500">
          {description}{' '}
          {!!learnMoreLink && (
            <Link isExternal href={learnMoreLink}>
              Learn more
            </Link>
          )}
        </Text>
      </ModalBody>
    </>
  )
}
