import { Box, ModalBody, ModalHeader } from '@chakra-ui/react'

import { NewFeatureTag } from './NewFeatureTag'

interface NewFeatureContentProps {
  title: string
  description: string
  ImageSvgr?: JSX.Element
}

const TopSpacer = (): JSX.Element => (
  <Box
    width="100%"
    height="4.5rem"
    backgroundColor="primary.100"
    borderTopRadius="1rem"
  />
)

export const NewFeatureContent = (props: {
  content: NewFeatureContentProps
}): JSX.Element => {
  const { title, description, ImageSvgr } = props.content

  return (
    <>
      <TopSpacer />
      {ImageSvgr}
      <ModalBody whiteSpace="pre-line" marginTop="2.5rem">
        <NewFeatureTag />
      </ModalBody>
      <ModalHeader>{title}</ModalHeader>
      <ModalBody whiteSpace="pre-line">{description}</ModalBody>
    </>
  )
}
