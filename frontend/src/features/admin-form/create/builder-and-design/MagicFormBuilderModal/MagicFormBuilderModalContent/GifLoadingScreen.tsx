import { ModalBody } from '@chakra-ui/react'

import { LottieAnimation } from '~templates/LottieAnimation'

import loadingAnimation from './assets/loadingAnimation.json'

export const MagicFormBuilderGifLoadingScreen = (): JSX.Element => {
  return (
    <>
      <ModalBody whiteSpace="pre-wrap">
        <LottieAnimation animationData={loadingAnimation}></LottieAnimation>
      </ModalBody>
    </>
  )
}
