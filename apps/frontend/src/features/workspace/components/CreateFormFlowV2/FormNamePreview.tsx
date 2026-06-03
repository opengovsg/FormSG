import { Box, Flex, Text } from '@chakra-ui/react'

interface FormNamePreviewProps {
  title: string
}

export const FormNamePreview = ({
  title,
}: FormNamePreviewProps): JSX.Element => {
  return (
    <Flex direction="column" align="center" w="80%" maxW="32rem">
      <Box
        w="100%"
        bg="white"
        borderRadius="0.25rem"
        overflow="hidden"
        boxShadow="0 1px 3px rgba(0, 0, 0, 0.08)"
      >
        {/* Blue header banner */}
        <Flex
          bg="primary.500"
          h="6rem"
          align="center"
          justify="center"
          px="2rem"
        >
          <Text
            textStyle="h2"
            color="white"
            textAlign="center"
            wordBreak="break-word"
            noOfLines={2}
          >
            {title || 'Your form name'}
          </Text>
        </Flex>

        {/* Form body with placeholder fields */}
        <Box bg="neutral.100" px="1.5rem" py="1.5rem">
          <Box bg="white" borderRadius="0.25rem" p="1.5rem">
            {/* Placeholder field 1 */}
            <Box mb="1.25rem">
              <Box
                h="0.75rem"
                w="40%"
                bg="neutral.300"
                borderRadius="0.125rem"
                mb="0.5rem"
              />
              <Box h="2.5rem" bg="neutral.200" borderRadius="0.25rem" />
            </Box>
            {/* Placeholder field 2 */}
            <Box mb="1.25rem">
              <Box
                h="0.75rem"
                w="55%"
                bg="neutral.300"
                borderRadius="0.125rem"
                mb="0.5rem"
              />
              <Box h="2.5rem" bg="neutral.200" borderRadius="0.25rem" />
            </Box>
            {/* Placeholder field 3 */}
            <Box>
              <Box
                h="0.75rem"
                w="30%"
                bg="neutral.300"
                borderRadius="0.125rem"
                mb="0.5rem"
              />
              <Box h="2.5rem" w="60%" bg="neutral.200" borderRadius="0.25rem" />
            </Box>
          </Box>
        </Box>
      </Box>
    </Flex>
  )
}
