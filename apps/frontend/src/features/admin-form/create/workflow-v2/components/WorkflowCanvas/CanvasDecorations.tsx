import { BiChevronDown, BiPlus } from 'react-icons/bi'
import { Box, Center, Flex, Icon, Text } from '@chakra-ui/react'

/**
 * Vertical connector line between step cards.
 * 16px line + 16px chevron + 16px line, matching Figma specs.
 */
export const ConnectionLine = (): JSX.Element => {
  return (
    <Flex direction="column" align="center" pt="2px">
      <Box w="2px" h="1rem" bg="secondary.200" />
      <Center w="1rem" h="1rem" bg="primary.100">
        <Icon as={BiChevronDown} fontSize="1rem" color="secondary.300" />
      </Center>
      <Box w="2px" h="1rem" bg="secondary.200" />
    </Flex>
  )
}

/**
 * "+" circle connector between steps.
 * Clickable - navigates to Add Steps phase with insert position.
 */
type AddStepConnectorProps = {
  onClick?: () => void
}

export const AddStepConnector = ({
  onClick,
}: AddStepConnectorProps): JSX.Element => {
  return (
    <Flex direction="column" align="center">
      <Center
        as={onClick ? 'button' : undefined}
        w="3rem"
        h="3rem"
        borderRadius="full"
        border="1px dashed"
        borderColor="primary.500"
        bg="white"
        cursor={onClick ? 'pointer' : undefined}
        onClick={onClick}
        _hover={onClick ? { bg: 'primary.100' } : undefined}
        transition="background 0.2s"
      >
        <Icon as={BiPlus} fontSize="1.5rem" color="primary.500" />
      </Center>
    </Flex>
  )
}

/**
 * Horizontal divider with centered "END OF WORKFLOW" text.
 * 32px vertical padding, 24px gap between line and text.
 */
export const WorkflowEndDivider = (): JSX.Element => {
  return (
    <Flex align="center" gap="1.5rem" py="2rem">
      <Box flex={1} h="1px" bg="secondary.200" />
      <Text
        textStyle="subhead-3"
        color="secondary.500"
        whiteSpace="nowrap"
        flexShrink={0}
      >
        END OF WORKFLOW
      </Text>
      <Box flex={1} h="1px" bg="secondary.200" />
    </Flex>
  )
}
