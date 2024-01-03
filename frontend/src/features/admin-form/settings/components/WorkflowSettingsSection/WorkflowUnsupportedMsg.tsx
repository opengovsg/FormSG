import { Flex, Text } from '@chakra-ui/react'

import { SettingsUnsupportedSvgr } from '~features/admin-form/settings/svgrs/SettingsUnsupportedSvgr'

export const WorkflowUnsupportedMsg = (): JSX.Element => {
  return (
    <Flex justify="center" flexDir="column" textAlign="center">
      <Text textStyle="h2" as="h2" color="primary.500" mb="1rem">
        Workflow is only available in multirespondent mode
      </Text>

      <SettingsUnsupportedSvgr />
    </Flex>
  )
}
