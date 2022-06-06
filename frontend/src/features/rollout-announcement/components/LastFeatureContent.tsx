import {
  Box,
  Container,
  Flex,
  ModalBody,
  ModalHeader,
  Stack,
  Text,
} from '@chakra-ui/react'

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
      <ModalBody
        whiteSpace="pre-line"
        marginTop="2.5rem"
        paddingInlineEnd="1.75rem"
      >
        <Stack spacing="2rem">
          {updates.map((update) => (
            <Flex gap="2rem" alignItems="center">
              <Box>{update.ImageSvgr}</Box>
              <Text textStyle="body-1" color="secondary.500">
                {update.title}
              </Text>
            </Flex>
          ))}
        </Stack>
      </ModalBody>
    </>
  )
}
