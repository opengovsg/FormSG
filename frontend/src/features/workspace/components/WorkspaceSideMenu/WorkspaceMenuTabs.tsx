import { Flex, FlexProps, Text } from '@chakra-ui/react'

import { Workspace, WorkspaceDto } from '~shared/types/workspace'

import { truncateLargeNumberWithPlus } from './utils'

interface WorkspaceTabProps extends FlexProps {
  label: string
  numForms: number
  isSelected: boolean
  onClick: () => void
  isDefault?: boolean
}

const WorkspaceTab = ({
  label,
  numForms,
  isSelected,
  onClick,
  isDefault = false,
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
      aria-label={`${label} folder tab`}
      {...styles}
      {...props}
    >
      <Text
        textStyle={
          isDefault ? 'subhead-3' : isSelected ? 'subhead-2' : 'body-2'
        }
        whiteSpace="nowrap"
        noOfLines={1}
        mr="2rem"
      >
        {label}
      </Text>
      <Text
        textStyle={
          isDefault ? 'subhead-2' : isSelected ? 'subhead-2' : 'body-2'
        }
      >
        {truncateLargeNumberWithPlus(numForms)}
      </Text>
    </Flex>
  )
}

interface WorkspaceMenuTabsProps {
  workspaces: WorkspaceDto[]
  currWorkspace: string
  onClick: (id: string) => void
  defaultWorkspace: Workspace
}

export const WorkspaceMenuTabs = ({
  workspaces,
  currWorkspace,
  onClick,
  defaultWorkspace,
}: WorkspaceMenuTabsProps): JSX.Element => (
  <>
    <WorkspaceTab
      key={defaultWorkspace._id}
      label={defaultWorkspace.title}
      numForms={defaultWorkspace.formIds.length}
      isSelected={defaultWorkspace._id === currWorkspace}
      onClick={() => onClick(defaultWorkspace._id)}
      isDefault
    />
    {workspaces.map((workspace: WorkspaceDto) => (
      <WorkspaceTab
        key={workspace._id}
        label={workspace.title}
        numForms={workspace.formIds.length}
        isSelected={workspace._id === currWorkspace}
        onClick={() => onClick(workspace._id)}
      />
    ))}
  </>
)
