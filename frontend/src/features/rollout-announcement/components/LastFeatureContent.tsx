import { Box, Container, ModalBody, ModalHeader, Text } from '@chakra-ui/react'

interface FeatureUpdate {
  title: string
  ImageSvgr: JSX.Element
}

interface LastFeatureContentProps {
  updates: FeatureUpdate[]
}

export const LastFeatureContent = (
  props: LastFeatureContentProps,
): JSX.Element => {
  const { updates } = props

  return (
    <>
      <ModalHeader>Other features and improvements</ModalHeader>
      <ModalBody whiteSpace="pre-line" marginTop="2rem">
        <Container
          display="flex"
          flexDirection="column"
          paddingInline={0}
          marginInline={0}
          rowGap={6}
        >
          {updates?.map((update) => (
            <Container
              display="flex"
              paddingInline={0}
              marginInline={0}
              columnGap={6}
            >
              <Box>{update.ImageSvgr}</Box>

              <Container
                display="flex"
                alignItems="center"
                paddingInline={0}
                marginInline={0}
              >
                <Text textStyle="subhead-1">{update.title}</Text>
              </Container>
            </Container>
          ))}
        </Container>
      </ModalBody>
    </>
  )
}
