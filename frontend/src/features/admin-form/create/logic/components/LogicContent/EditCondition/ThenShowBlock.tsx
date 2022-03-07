import { Flex, Stack } from '@chakra-ui/react'

import Input from '~components/Input'

import { BlockLabelText } from './BlockLabelText'

export const ThenShowBlock = (): JSX.Element => {
  return (
    <Stack direction="column" spacing="0.75rem" py="1.5rem" px="2rem">
      <Flex flexDir="row">
        <BlockLabelText>Then</BlockLabelText>
        <Input />
      </Flex>

      <Flex flexDir="row">
        <BlockLabelText>Show</BlockLabelText>
        <Input />
      </Flex>
    </Stack>
  )
}
