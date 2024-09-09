import { Flex, Icon, Stack, Text } from '@chakra-ui/react'

import { BxsInfoCircle } from '~assets/icons'
import Tooltip from '~components/Tooltip'

type StepLabelProps = {
  stepNumber: number
  tooltipLabel?: string
}

export const StepLabel = ({ stepNumber, tooltipLabel }: StepLabelProps) => (
  <Stack
    direction="row"
    spacing="1.5rem"
    alignItems="center"
    textStyle="subhead-3"
  >
    <Text
      py="0.5rem"
      px="1rem"
      borderWidth="1px"
      borderColor="secondary.300"
      borderRadius="4px"
    >
      {stepNumber + 1}
    </Text>
    <Flex direction="row">
      <Text>Step {stepNumber + 1}</Text>
      {tooltipLabel ? (
        <Tooltip label={tooltipLabel} placement="top">
          <Flex ml="0.5rem" justify="center" align="center">
            <Icon as={BxsInfoCircle} fontSize="1rem" />
          </Flex>
        </Tooltip>
      ) : null}
    </Flex>
  </Stack>
)
