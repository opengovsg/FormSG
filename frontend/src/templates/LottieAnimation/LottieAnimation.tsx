import { useEffect, useRef } from 'react'
import { Box, BoxProps } from '@chakra-ui/react'
import lottie, { AnimationConfigWithData, SVGRendererConfig } from 'lottie-web'

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
