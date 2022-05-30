import { useEffect, useRef } from 'react'
import { Box, ModalBody, ModalHeader } from '@chakra-ui/react'
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

interface LottieProps {
  animationData: unknown
  width?: number
  height?: number
}

export const Lottie = ({ animationData, width, height }: LottieProps) => {
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

  return <div style={{ width, height }} ref={element}></div>
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
      <Lottie animationData={animationData} />
      <ModalBody whiteSpace="pre-line" marginTop="2.5rem">
        <NewFeatureTag />
      </ModalBody>
      <ModalHeader>{title}</ModalHeader>
      <ModalBody whiteSpace="pre-line">{description}</ModalBody>
    </>
  )
}
