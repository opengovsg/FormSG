import { Meta, StoryFn } from '@storybook/react'

import {
  BasicField,
  DateFieldBase,
  DateSelectedValidation,
  InvalidDaysOptions,
} from '~shared/types'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditDate } from './EditDate'

const DEFAULT_DATE_FIELD: DateFieldBase = {
  title: 'Storybook Date',
  description: 'Some description',
  dateValidation: {
    selectedDateValidation: null,
    customMaxDate: null,
    customMinDate: null,
  },
  invalidDays: [],
  required: true,
  disabled: false,
  fieldType: BasicField.Date,
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditDate',
  component: EditDate,
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
    field: DEFAULT_DATE_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: DateFieldBase
}

const Template: StoryFn<StoryArgs> = ({ field }) => {
  return <EditDate field={field} />
}

export const Default = Template.bind({})

export const WithNoFutureDates = Template.bind({})
WithNoFutureDates.args = {
  field: {
    ...DEFAULT_DATE_FIELD,
    dateValidation: {
      selectedDateValidation: DateSelectedValidation.NoFuture,
      customMaxDate: null,
      customMinDate: null,
    },
  },
}

export const WithCustomDateRange = Template.bind({})
WithCustomDateRange.args = {
  field: {
    ...DEFAULT_DATE_FIELD,
    dateValidation: {
      selectedDateValidation: DateSelectedValidation.Custom,
      customMinDate: new Date('2020-01-01T00:00:00Z'),
      customMaxDate: new Date('2020-01-12T00:00:00Z'),
    },
  },
}

export const WithParticularDaysRestricted = Template.bind({})
WithParticularDaysRestricted.args = {
  field: {
    ...DEFAULT_DATE_FIELD,
    invalidDays: [InvalidDaysOptions.Monday, InvalidDaysOptions.Saturday],
  },
}
