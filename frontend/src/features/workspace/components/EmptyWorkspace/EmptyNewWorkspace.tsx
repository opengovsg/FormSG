import { EmptyWorkspace, EmptyWorkspacePage } from './EmptyWorkspace'

export const EmptyNewWorkspace = ({ isLoading }: EmptyWorkspacePage) => (
  <EmptyWorkspace
    isLoading={isLoading}
    title={'You don’t have any forms in this folder yet'}
    subText={'Organise your forms by grouping them into folders'}
  />
)
