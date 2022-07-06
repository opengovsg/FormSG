import { Meta, Story } from '@storybook/react'

import { Country } from '~shared/constants/countries'
import { BasicField, CountryFieldBase } from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditCountry } from './EditCountry'

const DEFAULT_COUNTRY_FIELD: CountryFieldBase = {
  title: 'Storybook Country',
  description: 'Some description about Country',
  required: true,
  disabled: false,
  fieldType: BasicField.Country,
  fieldOptions: Object.values(Country),
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditCountry',
  component: EditCountry,
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
    msw: createFormBuilderMocks({}, 0),
  },
  args: {
    field: DEFAULT_COUNTRY_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: CountryFieldBase
}

const Template: Story<StoryArgs> = ({ field }) => {
  return <EditCountry field={field} />
}

export const Default = Template.bind({})
Default.storyName = 'EditCountry'
