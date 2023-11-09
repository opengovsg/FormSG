import { EmptyWorkspace, EmptyWorkspacePage } from './EmptyWorkspace'

export const EmptyDefaultWorkspace = ({
  isLoading,
  handleOpenCreateFormModal,
}: EmptyWorkspacePage) => (
  <EmptyWorkspace
    isLoading={isLoading}
    handleOpenCreateFormModal={handleOpenCreateFormModal}
    title={"You don't have any forms yet"}
    subText={'Get started by creating a new form'}
  />
)
