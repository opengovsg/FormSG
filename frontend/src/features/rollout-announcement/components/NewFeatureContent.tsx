import { useEffect, useRef } from 'react'
import { Box, BoxProps, ModalBody, ModalHeader, Text } from '@chakra-ui/react'
import lottie from 'lottie-web'

import { NewFeatureTag } from './NewFeatureTag'

const TopSpacer = (): JSX.Element => (
  <Box
    width="100%"
    height="4.5rem"
    backgroundColor="primary.100"
    borderTopRadius="1rem"
  />
)

interface LottieAnimationProps extends BoxProps {
  animationData: unknown
}

export const LottieAnimation = ({
  animationData,
  ...boxProps
}: LottieAnimationProps) => {
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
      <TopSpacer />
      <LottieAnimation animationData={animationData} />
      <ModalBody whiteSpace="pre-line" marginTop="2.5rem">
        <NewFeatureTag />
      </ModalBody>
      <ModalHeader paddingTop="0.625rem" paddingBottom="0.625rem">
        {title}
      </ModalHeader>
      <ModalBody whiteSpace="pre-line" paddingRight="3rem">
        <Text textStyle="body-1" color="secondary.500">
          {description}
        </Text>
      </ModalBody>
    </>
  )
}
