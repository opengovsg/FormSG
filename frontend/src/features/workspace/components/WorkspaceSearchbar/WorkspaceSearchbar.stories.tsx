import { Meta, StoryFn } from '@storybook/react'

import {
  WorkspaceSearchbar,
  WorkspaceSearchbarProps,
} from './WorkspaceSearchbar'

export default {
  title: 'Pages/WorkspacePage/WorkspaceSearchbar',
  component: WorkspaceSearchbar,
  decorators: [],
} as Meta

export const Default: StoryFn<WorkspaceSearchbarProps> = (args) => {
  return <WorkspaceSearchbar {...args} />
}
