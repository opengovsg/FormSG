import { Flex, Icon, Stack, Text } from '@chakra-ui/react'

import { BxsInfoCircleAlt } from '~assets/icons/BxsInfoCircleAlt'
import Tooltip from '~components/Tooltip'

export const FormStepWithHeader = ({
  headerText,
  tooltipText,
  children,
}: {
  headerText: string
  tooltipText?: string
  children?: React.ReactNode
}): JSX.Element => {
  return (
    <Stack
      direction="column"
      spacing="0.75rem"
      py="1.5rem"
      px={{ base: '1.5rem', md: '2rem' }}
      borderTopWidth="1px"
      borderTopColor="secondary.200"
    >
      <Flex alignItems="center" gap="0.5rem">
        <Text textStyle="subhead-3">{headerText}</Text>
        {tooltipText ? (
          <Tooltip placement="top" label={tooltipText}>
            <Icon as={BxsInfoCircleAlt} />
          </Tooltip>
        ) : null}
      </Flex>
      {children}
    </Stack>
  )
}
