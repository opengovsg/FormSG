// TODO #4279: Remove after React rollout is complete
import { Box, Flex, Text } from '@chakra-ui/react'

import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

import { useEnvMutations } from '~features/env/mutations'

export const PublicSwitchEnvMessage = (): JSX.Element => {
  const { publicSwitchEnvMutation } = useEnvMutations()

  return (
    <Flex justify="center">
      <Box w="100%" minW={0} h="fit-content" maxW="57rem">
        <InlineMessage
          variant="warning"
          mb="1.5rem"
          mt={{ base: '1.5rem', md: '0' }}
        >
          <Text>
            You're filling this form on the new FormSG. If you have trouble
            submitting,
            <Button
              variant="link"
              onClick={() => publicSwitchEnvMutation.mutate}
            >
              <Text as="u">switch to the original one here.</Text>
            </Button>
          </Text>
        </InlineMessage>
      </Box>
    </Flex>
  )
}
