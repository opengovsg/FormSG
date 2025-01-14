import { Meta, StoryFn } from '@storybook/react'

import { BasicField, RatingFieldBase, RatingShape } from '~shared/types'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditRating } from './EditRating'

const DEFAULT_RATING_FIELD: RatingFieldBase = {
  title: 'Storybook Rating',
  description: 'Some description',
  required: true,
  disabled: false,
  fieldType: BasicField.Rating,
  ratingOptions: {
    shape: RatingShape.Star,
    steps: 5,
  },
  globalId: 'unused',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditRating',
  component: EditRating,
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
    field: DEFAULT_RATING_FIELD,
  },
} as Meta<StoryArgs>

interface StoryArgs {
  field: RatingFieldBase
}

const Template: StoryFn<StoryArgs> = ({ field }) => {
  return <EditRating field={field} />
}

export const Default = Template.bind({})
Default.storyName = 'EditRating'
