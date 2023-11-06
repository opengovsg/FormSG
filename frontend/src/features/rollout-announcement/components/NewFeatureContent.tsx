import { Image, ModalBody, ModalHeader, Text } from '@chakra-ui/react'

import Link from '~components/Link'
import { LottieAnimation } from '~templates/LottieAnimation'

import { NewFeature } from './AnnouncementsFeatureList'
import { NewFeatureTag } from './NewFeatureTag'

export const NewFeatureContent = (props: {
  content: NewFeature
}): JSX.Element => {
  const { title, description, image, learnMoreLink } = props.content

  return (
    <>
      {image?.animationData ? (
        <LottieAnimation
          bg="primary.100"
          pt="4.5rem"
          height={{ base: '30vh', md: 'initial' }}
          animationData={image.animationData}
          preserveAspectRatio="xMidYMax slice"
        />
      ) : (
        <Image width="100%" src={image.url} alt={image.alt} />
      )}
      <ModalHeader>
        <NewFeatureTag />
        <Text mt="0.625rem">{title}</Text>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Text textStyle="body-1" color="secondary.500">
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
