import {
  Box,
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
      <ModalHeader>Other updates</ModalHeader>
      <ModalBody whiteSpace="pre-line">
        <Stack spacing="2rem">
          {updates.map((update, idx) => (
            <Flex gap="2rem" alignItems="center" key={idx}>
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
