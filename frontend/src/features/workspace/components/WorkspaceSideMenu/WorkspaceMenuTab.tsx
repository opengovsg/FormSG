import { Flex, FlexProps, Text } from '@chakra-ui/react'

import {
  truncateLargeNumberWithPlus,
  truncateLongTextWithEllipsis,
} from './utils'

interface WorkspaceMenuTabProps extends FlexProps {
  label: string
  numForms: number
  isSelected: boolean
  onClick: () => void
}

export const WorkspaceMenuTab = ({
  label,
  numForms,
  isSelected,
  onClick,
  ...props
}: WorkspaceMenuTabProps): JSX.Element => {
  const styles = isSelected
    ? {
        borderLeft: '4px',
        borderLeftColor: 'var(--chakra-colors-primary-500)',
        textColor: 'var(--chakra-colors-primary-500)',
      }
    : {}

  return (
    <Flex
      as="button"
      justifyContent="space-between"
      w="100%"
      pl="2rem"
      pr="1.5rem"
      h="3.5rem"
      alignItems="center"
      _hover={{
        textColor: 'var(--chakra-colors-primary-500)',
      }}
      onClick={onClick}
      {...styles}
      {...props}
    >
      <Text textStyle="body-2" whiteSpace="nowrap">
        {truncateLongTextWithEllipsis(label)}
      </Text>
      <Text textStyle="body-2">{truncateLargeNumberWithPlus(numForms)}</Text>
    </Flex>
  )
}
