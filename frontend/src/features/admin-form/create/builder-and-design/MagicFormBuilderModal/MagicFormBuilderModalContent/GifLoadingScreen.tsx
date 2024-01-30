import { ModalBody } from '@chakra-ui/react'

export const MagicFormBuilderGifLoadingScreen = (): JSX.Element => {
  return (
    <>
      <ModalBody whiteSpace="pre-wrap">
        <img src="/magicBuilderLoading.gif" alt="loading gif" />
      </ModalBody>
    </>
  )
}
