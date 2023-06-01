import { Meta, Story } from '@storybook/react'

import {
  WorkspaceSearchbar,
  WorkspaceSearchbarProps,
} from './WorkspaceSearchbar'

export default {
  title: 'Pages/WorkspacePage/WorkspaceSearchbar',
  component: WorkspaceSearchbar,
  decorators: [],
} as Meta

export const Default: Story<WorkspaceSearchbarProps> = (args) => {
  return <WorkspaceSearchbar {...args} />
}
