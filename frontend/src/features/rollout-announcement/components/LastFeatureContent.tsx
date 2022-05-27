import {
  Box,
  Container,
  ListItem,
  ModalBody,
  ModalHeader,
  Text,
  UnorderedList,
} from '@chakra-ui/react'

interface FeatureUpdate {
  title: string
  description: string[]
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
      <ModalHeader>Other updates</ModalHeader>
      <ModalBody whiteSpace="pre-line" marginTop="2.5rem">
        <Container
          display="flex"
          flexDirection="column"
          paddingInline={0}
          marginInline={0}
          rowGap={4}
        >
          {updates?.map((update) => {
            const bulletPoints = update.description

            return (
              <Container
                display="flex"
                paddingInline={0}
                marginInline={0}
                columnGap={8}
              >
                <Box>{update.ImageSvgr}</Box>

                <Container paddingInline={0} marginInline={0}>
                  <Text textStyle="subhead-1">{update.title}</Text>
                  <UnorderedList>
                    {bulletPoints?.map((bulletPoint) => {
                      return <ListItem>{bulletPoint}</ListItem>
                    })}
                  </UnorderedList>
                </Container>
              </Container>
            )
          })}
        </Container>
      </ModalBody>
    </>
  )
}
