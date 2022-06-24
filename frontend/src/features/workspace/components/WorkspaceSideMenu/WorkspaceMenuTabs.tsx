import { Flex, FlexProps, Text } from '@chakra-ui/react'

import { truncateLargeNumberWithPlus } from './utils'

interface WorkspaceTabProps extends FlexProps {
  label: string
  numForms: number
  isSelected: boolean
  onClick: () => void
}

const WorkspaceTab = ({
  label,
  numForms,
  isSelected,
  onClick,
  ...props
}: WorkspaceTabProps): JSX.Element => {
  const styles = isSelected
    ? {
        borderLeft: '2px',
        borderLeftColor: 'primary.500',
        textColor: 'primary.500',
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
        textColor: 'primary.500',
      }}
      onClick={onClick}
      aria-label={`${label} workspace tab`}
      {...styles}
      {...props}
    >
      <Text textStyle="body-2" whiteSpace="nowrap" isTruncated>
        {label}
      </Text>
      <Text textStyle="body-2">{truncateLargeNumberWithPlus(numForms)}</Text>
    </Flex>
  )
}

interface WorkspaceMenuTabsProps {
  // TODO (hans): Change workspace type to use WorkspaceDto when its created
  workspaces: any
  currWorkspace: string
  onClick: (id: string) => void
}
export const WorkspaceMenuTabs = ({
  workspaces,
  currWorkspace,
  onClick,
}: WorkspaceMenuTabsProps): JSX.Element => (
  <>
    {workspaces.map((workspace: any) => (
      <WorkspaceTab
        key={workspace._id}
        label={workspace.title}
        numForms={workspace.numForms}
        isSelected={workspace._id === currWorkspace}
        onClick={() => onClick(workspace._id)}
      />
    ))}
  </>
)
