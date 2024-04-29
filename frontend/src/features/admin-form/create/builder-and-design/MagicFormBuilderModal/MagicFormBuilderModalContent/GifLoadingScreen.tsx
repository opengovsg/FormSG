import { Box, ModalBody } from '@chakra-ui/react'

import { LottieAnimation } from '~templates/LottieAnimation'

import updatedLoadingAnimation from './assets/updatedLoadingAnimation.json'

export const MagicFormBuilderGifLoadingScreen = (): JSX.Element => {
  return (
    <>
      <ModalBody>
        <Box display="flex" justifyContent="center">
          <LottieAnimation
            animationData={updatedLoadingAnimation}
            width="47.4rem"
            height="22rem"
          />
        </Box>
        <Box
          textAlign="center"
          fontSize="1.25rem"
          mt="2.25rem"
          fontWeight="600"
        >
          Building your form... Check back later!
        </Box>
      </ModalBody>
    </>
  )
}
