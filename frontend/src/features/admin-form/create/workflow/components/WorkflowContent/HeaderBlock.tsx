import { Flex, Text } from '@chakra-ui/react'

import { MultiParty } from '~assets/icons'
import InlineMessage from '~components/InlineMessage'

export const HeaderBlock = (): JSX.Element => {
  return (
    <InlineMessage icon={MultiParty}>
      <Flex flexDir="column">
        <Text textStyle="subhead-3">Create a workflow for your form</Text>
        <Text>
          Add multiple steps, and for each of them, assign who should respond to
          it, and select fields that they can see and fill.
        </Text>
      </Flex>
    </InlineMessage>
  )
}
