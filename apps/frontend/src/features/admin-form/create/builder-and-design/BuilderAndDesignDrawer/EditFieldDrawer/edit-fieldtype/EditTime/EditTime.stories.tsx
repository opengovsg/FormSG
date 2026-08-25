import { Meta, StoryFn } from '@storybook/react'

import { BasicField, TimeFieldBase } from 'formsg-shared/types'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditTime } from './EditTime'

const DEFAULT_TIME_FIELD: TimeFieldBase = {
  title: 'Storybook Time',
  description: 'Some description',
  required: true,
  disabled: false,
  fieldType: BasicField.Time,
  globalId: 'unused',
  use24HourFormat: true,
  includeSeconds: false,
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditTime',
  component: EditTime,
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
    EditFieldDrawerDecorator,
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
  },
  args: {
    field: DEFAULT_TIME_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: TimeFieldBase
}

const Template: StoryFn<StoryArgs> = ({ field }) => {
  return <EditTime field={field} />
}

/** The defaults a newly created Time field carries: 24-hour, no seconds. */
export const Default = Template.bind({})

export const TwelveHourClock = Template.bind({})
TwelveHourClock.args = {
  field: { ...DEFAULT_TIME_FIELD, use24HourFormat: false },
}

export const WithSeconds = Template.bind({})
WithSeconds.args = {
  field: { ...DEFAULT_TIME_FIELD, includeSeconds: true },
}

/** Both toggles off the default — 12-hour with seconds. */
export const TwelveHourWithSeconds = Template.bind({})
TwelveHourWithSeconds.args = {
  field: {
    ...DEFAULT_TIME_FIELD,
    use24HourFormat: false,
    includeSeconds: true,
  },
}
