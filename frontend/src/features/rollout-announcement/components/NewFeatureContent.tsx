import { ModalBody, ModalHeader, Text } from '@chakra-ui/react'
import { AnimationConfigWithData } from 'lottie-web'

import Link from '~components/Link'
import { LottieAnimation } from '~templates/LottieAnimation'

import { NewFeatureTag } from './NewFeatureTag'

interface NewFeatureContentProps {
  title: string
  description: string
  learnMoreLink: string
  animationData: AnimationConfigWithData['animationData']
}

export const NewFeatureContent = (props: {
  content: NewFeatureContentProps
}): JSX.Element => {
  const { title, description, animationData, learnMoreLink } = props.content

  return (
    <>
      <LottieAnimation
        bg="primary.100"
        pt="4.5rem"
        height={{ base: '30vh', md: 'initial' }}
        animationData={animationData}
        preserveAspectRatio="xMidYMax slice"
      />
      <ModalHeader>
        <NewFeatureTag />
        <Text mt="0.625rem">{title}</Text>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Text textStyle="body-1" color="secondary.500">
          {description}
        </Text>
        <Text textStyle="body-1" color="secondary.500">
          Click <Link href={learnMoreLink}>here</Link> to learn more.
        </Text>
      </ModalBody>
    </>
  )
}
