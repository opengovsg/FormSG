import { Flex, Text } from '@chakra-ui/react'
import { Infobox } from '@opengovsg/design-system-react'

import { MultiParty } from '~assets/icons'

export const HeaderBlock = (): JSX.Element => {
  return (
    <Infobox icon={<MultiParty />}>
      <Flex flexDir="column">
        <Text textStyle="subhead-3">Create a workflow for your form</Text>
        <Text>
          Add multiple steps, and for each step, assign a respondent, and select
          fields that they can fill.
        </Text>
      </Flex>
    </Infobox>
  )
}
