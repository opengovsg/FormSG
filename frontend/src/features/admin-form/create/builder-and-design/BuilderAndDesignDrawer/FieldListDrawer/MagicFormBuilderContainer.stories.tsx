import { Meta } from '@storybook/react/*'

import { StoryRouter } from '~utils/storybook'

import { MagicFormBuilderPopover } from './MagicFormBuilderContainer'

export default {
  component: MagicFormBuilderPopover,
  title:
    'Features/AdminForm/create/builder-and-design/BuilderAndDesignDrawer/FieldListDrawer/MagicFormBuilderContainer',
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
} as Meta

const defaultArgs = {
  isOpen: false,
  isAcceptDenyOpen: false,
  onMfbClick: () => {},
  onClose: () => {},
  onAccept: () => {},
  onDeny: () => {},
}

export const NotActive = {
  args: defaultArgs,
}

export const ActivePrompt = {
  args: {
    ...defaultArgs,
    isOpen: true,
    isAcceptDenyOpen: false,
  },
}

export const ActiveAcceptDeny = {
  args: {
    ...defaultArgs,
    isOpen: true,
    isAcceptDenyOpen: true,
  },
}
