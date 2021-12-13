import { Divider, Stack } from '@chakra-ui/react'

import { AdminDashboardFormMetaDto } from '~shared/types/form/form'

import { CONTAINER_MAXW } from '~features/workspace/WorkspacePage'

import { WorkspaceFormRow } from './WorkspaceFormRow'
import { WorkspaceFormRowSkeleton } from './WorkspaceFormRowSkeleton'

export interface WorkspaceFormRowsProps {
  rows: AdminDashboardFormMetaDto[]
  isLoading: boolean
}

const WorkspaceFormRowsSkeleton = () => {
  return (
    <Stack
      maxW={CONTAINER_MAXW}
      m="auto"
      spacing={0}
      divider={<Divider borderColor="neutral.300" />}
    >
      <WorkspaceFormRowSkeleton />
      <WorkspaceFormRowSkeleton />
      <WorkspaceFormRowSkeleton />
      <WorkspaceFormRowSkeleton />
    </Stack>
  )
}

export const WorkspaceFormRows = ({
  rows,
  isLoading,
}: WorkspaceFormRowsProps): JSX.Element => {
  if (isLoading) {
    return <WorkspaceFormRowsSkeleton />
  }
  return (
    <Stack
      maxW={CONTAINER_MAXW}
      m="auto"
      spacing={0}
      divider={<Divider borderColor="neutral.300" />}
    >
      {rows.map((meta) => (
        <WorkspaceFormRow px="2rem" key={meta._id} formMeta={meta} />
      ))}
    </Stack>
  )
}
