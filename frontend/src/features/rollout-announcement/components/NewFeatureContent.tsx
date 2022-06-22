import { useEffect, useRef } from 'react'
import { Box, BoxProps, ModalBody, ModalHeader, Text } from '@chakra-ui/react'
import lottie, { AnimationConfigWithData, SVGRendererConfig } from 'lottie-web'

import { NewFeatureTag } from './NewFeatureTag'

interface LottieAnimationProps extends BoxProps {
  animationData: AnimationConfigWithData['animationData']
  preserveAspectRatio?: SVGRendererConfig['preserveAspectRatio']
}

export const LottieAnimation = ({
  animationData,
  preserveAspectRatio,
  ...boxProps
}: LottieAnimationProps): JSX.Element => {
  const element = useRef<HTMLDivElement>(null)
  const lottieInstance = useRef<unknown>()

  useEffect(() => {
    if (!element.current) return

    lottieInstance.current = lottie.loadAnimation({
      animationData,
      container: element.current,
      rendererSettings: {
        preserveAspectRatio: preserveAspectRatio,
      },
    })

    return () => {
      lottieInstance.current = lottie.destroy()
    }
  }, [animationData, preserveAspectRatio])

  return <Box {...boxProps} ref={element} />
}

interface NewFeatureContentProps {
  title: string
  description: string
  animationData: AnimationConfigWithData['animationData']
}

export const NewFeatureContent = (props: {
  content: NewFeatureContentProps
}): JSX.Element => {
  const { title, description, animationData } = props.content

  return (
    <>
      <LottieAnimation
        // The link will always change in Chromatic so this should be ignored.
        data-chromatic="ignore"
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
      <ModalBody whiteSpace="pre-line">
        <Text textStyle="body-1" color="secondary.500">
          {description}
        </Text>
      </ModalBody>
    </>
  )
}
