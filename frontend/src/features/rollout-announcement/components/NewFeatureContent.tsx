import { useEffect, useRef } from 'react'
import { Box, BoxProps, ModalBody, ModalHeader, Text } from '@chakra-ui/react'
import lottie from 'lottie-web'

import { NewFeatureTag } from './NewFeatureTag'

interface LottieAnimationProps extends BoxProps {
  animationData: unknown
}

export const LottieAnimation = ({
  animationData,
  ...boxProps
}: LottieAnimationProps): JSX.Element => {
  const element = useRef<HTMLDivElement>(null)
  const lottieInstance = useRef<unknown>()

  useEffect(() => {
    if (!element.current) return

    lottieInstance.current = lottie.loadAnimation({
      animationData,
      container: element.current,
    })

    return () => {
      lottieInstance.current = lottie.destroy()
    }
  }, [animationData])

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

  return (
    <>
      <LottieAnimation
        bg="primary.100"
        pt="4.5rem"
        animationData={animationData}
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
