import { Meta, Story } from '@storybook/react'

import { CountryRegion } from '~shared/constants/countryRegion'
import { BasicField, CountryRegionFieldBase } from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditCountryRegion } from './EditCountryRegion'

const DEFAULT_COUNTRY_REGION_FIELD: CountryRegionFieldBase = {
  title: 'Storybook Country/Region',
  description: 'Some description about Country/Region',
  required: true,
  disabled: false,
  fieldType: BasicField.CountryRegion,
  fieldOptions: Object.values(CountryRegion),
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditCountryRegion',
  component: EditCountryRegion,
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
    field: DEFAULT_COUNTRY_REGION_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: CountryRegionFieldBase
}

const Template: Story<StoryArgs> = ({ field }) => {
  return <EditCountryRegion field={field} />
}

export const Default = Template.bind({})
Default.storyName = 'EditCountryRegion'
