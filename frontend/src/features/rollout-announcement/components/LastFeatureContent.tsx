import { Box, Container, ModalBody, ModalHeader, Text } from '@chakra-ui/react'

interface FeatureUpdate {
  title: string
  ImageSvgr: JSX.Element
}

interface LastFeatureContentProps {
  updates: FeatureUpdate[]
}

export const LastFeatureContent = ({
  updates,
}: LastFeatureContentProps): JSX.Element => {
  return (
    <>
      <ModalHeader paddingBottom="0.5rem">
        Other features and improvements
      </ModalHeader>
      <ModalBody whiteSpace="pre-line" marginTop="2.5rem">
        <Container
          display="flex"
          flexDirection="column"
          paddingInline={0}
          marginInline={0}
          rowGap="2rem"
        >
          {updates?.map((update) => (
            <Container
              display="flex"
              paddingInline={0}
              marginInline={0}
              columnGap="2rem"
            >
              <Box>{update.ImageSvgr}</Box>

              <Container
                display="flex"
                alignItems="center"
                paddingInline={0}
                marginInline={0}
              >
                <Text textStyle="body-1" color="secondary.500">
                  {update.title}
                </Text>
              </Container>
            </Container>
          ))}
        </Container>
      </ModalBody>
    </>
  )
}
