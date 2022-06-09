import { useEffect, useRef } from 'react'
import { Box, BoxProps, ModalBody, ModalHeader, Text } from '@chakra-ui/react'
import lottie from 'lottie-web'

import { useIsMobile } from '~hooks/useIsMobile'

import { NewFeatureTag } from './NewFeatureTag'

interface LottieAnimationProps extends BoxProps {
  animationData: unknown
  preserveAspectRatio?: string
}

export const LottieAnimation = ({
  animationData,
  preserveAspectRatio = '',
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
  animationData: unknown
}

export const NewFeatureContent = (props: {
  content: NewFeatureContentProps
}): JSX.Element => {
  const { title, description, animationData } = props.content
  const isMobile = useIsMobile()

  return (
    <>
      <LottieAnimation
        bg="primary.100"
        pt="4.5rem"
        height={isMobile ? '33vh' : ''}
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
