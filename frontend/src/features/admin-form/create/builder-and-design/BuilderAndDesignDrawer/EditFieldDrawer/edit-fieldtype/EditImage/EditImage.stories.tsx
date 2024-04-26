import { Meta, StoryFn } from '@storybook/react'

import { BasicField, ImageFieldBase } from '~shared/types'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import { EditFieldDrawerDecorator, StoryRouter } from '~utils/storybook'

import { EditFieldProps } from '../common/types'

import { EditImage } from './EditImage'

const DEFAULT_IMAGE_FIELD: EditFieldProps<ImageFieldBase>['field'] = {
  title: 'Storybook Image',
  description:
    'Some description about the image. This will be shown below the image',
  required: true,
  disabled: false,
  fieldType: BasicField.Image,
  globalId: 'unused',
  fileMd5Hash: '',
  name: '',
  url: '',
  size: '',
}

export default {
  title: 'Features/AdminForm/EditFieldDrawer/EditImage',
  component: EditImage,
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
    field: DEFAULT_IMAGE_FIELD,
  },
} as Meta<EditFieldProps<ImageFieldBase>>

const Template: StoryFn<EditFieldProps<ImageFieldBase>> = ({ field }) => {
  return <EditImage field={field} />
}

export const Default = Template.bind({})

export const WithUploadedImage = Template.bind({})
WithUploadedImage.args = {
  field: {
    ...DEFAULT_IMAGE_FIELD,
    url: 'not-used-for-this-drawer',
    fileMd5Hash: 'random md5 hash',
    name: 'mock-storybook-upload.jpg',
    size: '1.99 MB',
  },
}
