import { times } from 'lodash'

import { AdminDashboardFormMetaDto } from '~shared/types/form/form'

import { WorkspaceFormRow } from './WorkspaceFormRow'
import { WorkspaceFormRowSkeleton } from './WorkspaceFormRowSkeleton'

export interface WorkspaceFormRowsProps {
  rows: AdminDashboardFormMetaDto[]
  isLoading: boolean
}

export const WorkspaceFormRows = ({
  rows,
  isLoading,
}: WorkspaceFormRowsProps): JSX.Element => {
  if (isLoading) {
    return (
      <>
        {times(4, (idx) => (
          <WorkspaceFormRowSkeleton key={idx} />
        ))}
      </>
    )
  }

  return (
    <>
      {rows.map((meta) => (
        <WorkspaceFormRow px="2rem" key={meta._id} formMeta={meta} />
      ))}
    </>
  )
}
