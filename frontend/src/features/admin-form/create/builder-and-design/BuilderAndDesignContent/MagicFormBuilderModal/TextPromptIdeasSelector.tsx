import { BiBulb } from 'react-icons/bi'
import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react'

export const TextPromptIdeasSelector = ({
  promptIdeas,
  handleIdeaClick,
}: {
  promptIdeas: string[]
  handleIdeaClick: (idea: string) => void
}): JSX.Element => {
  return (
    <Box
      bgColor="white"
      border="1px"
      borderColor="neutral.400"
      py="1rem"
      px="1rem"
      borderRadius="0.25rem"
    >
      <Flex mb="1rem">
        <BiBulb fontSize="1.6rem" />
        <Text textStyle="subhead-1" px="1rem">
          Try one of these
        </Text>
      </Flex>
      {!promptIdeas?.length ? (
        <Text>No prompt ideas found</Text>
      ) : (
        <Stack>
          {promptIdeas.map((idea: string) => (
            <Button
              key={idea}
              h="100%"
              w="100%"
              borderColor="secondary.200"
              borderWidth="1px"
              variant="clear"
              color="secondary.500"
              onClick={() => handleIdeaClick(idea)}
            >
              <Text
                textAlign="left"
                textStyle="subhead-1"
                color="secondary.500"
                fontWeight="400"
              >
                {idea}
              </Text>
            </Button>
          ))}
        </Stack>
      )}
    </Box>
  )
}
