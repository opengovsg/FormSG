import PhoneFieldFeatureUpdateImg from './assets/phone_field_feature_update.svg'
import WorkspaceFeatureUpdateImg from './assets/workspaces_feature_update.svg'

export interface FeatureUpdateImage {
  url: string
  alt: string
}
export interface FeatureUpdate {
  id: number
  date: Date
  title: string
  description: string
  image?: FeatureUpdateImage
}

// TODO: Confirm the actual features which will be showcased in the What's New section
export const FEATURE_UPDATE_LIST: FeatureUpdate[] = [
  {
    id: 1,
    date: new Date('17 June 2022 GMT+8'),
    title: 'UI Improvements',
    description: `
  * Cool new datepicker with day, month, and year views
  * Loading indicators for verified field OTPs
  * Consistent mobile field styling
  `,
  },
  {
    id: 2,
    date: new Date('17 June 2022 GMT+8'),
    title: 'No more hangups',
    description:
      'With the new Phone Number field, you can quickly collect people’s digits. Local and international validation available.',
    image: {
      url: PhoneFieldFeatureUpdateImg,
      alt: 'Phone Field Feature Update',
    },
  },
  {
    id: 3,
    date: new Date('17 June 2022 GMT+8'),
    title: 'Introducing Workspaces',
    description:
      "A workspace that's never messy. The first thing you see when you log into FormSG is your Workspace. This is where you store and organize all of your forms. Create multiple Workspaces and move your forms into them to stay organised.",
    image: {
      url: WorkspaceFeatureUpdateImg,
      alt: 'Workspace Feature Update',
    },
  },
  {
    id: 4,
    date: new Date('17 June 2022 GMT+8'),
    title: 'UI Improvements',
    description: `
* Cool new datepicker with day, month, and year views
* Loading indicators for verified field OTPs
* Consistent mobile field styling
    `,
  },
  {
    id: 5,
    date: new Date('17 June 2022 GMT+8'),
    title: 'No more hangups',
    description:
      'With the new Phone Number field, you can quickly collect people’s digits. Local and international validation available.',
    image: {
      url: PhoneFieldFeatureUpdateImg,
      alt: 'Phone Field Feature Update',
    },
  },
  {
    id: 6,
    date: new Date('17 June 2022 GMT+8'),
    title: 'Introducing Workspaces',
    description:
      "A workspace that's never messy. The first thing you see when you log into FormSG is your Workspace. This is where you store and organize all of your forms. Create multiple Workspaces and move your forms into them to stay organised.",
    image: {
      url: WorkspaceFeatureUpdateImg,
      alt: 'Workspace Feature Update',
    },
  },
  {
    id: 7,
    date: new Date('17 June 2022 GMT+8'),
    title: 'UI Improvements',
    description: `
* Cool new datepicker with day, month, and year views
* Loading indicators for verified field OTPs
* Consistent mobile field styling
    `,
  },
  {
    id: 8,
    date: new Date('17 June 2022 GMT+8'),
    title: 'No more hangups',
    description:
      'With the new Phone Number field, you can quickly collect people’s digits. Local and international validation available.',
    image: {
      url: PhoneFieldFeatureUpdateImg,
      alt: 'Phone Field Feature Update',
    },
  },
  {
    id: 9,
    date: new Date('17 June 2022 GMT+8'),
    title: 'Introducing Workspaces',
    description:
      "A workspace that's never messy. The first thing you see when you log into FormSG is your Workspace. This is where you store and organize all of your forms. Create multiple Workspaces and move your forms into them to stay organised.",
    image: {
      url: WorkspaceFeatureUpdateImg,
      alt: 'Workspace Feature Update',
    },
  },
  {
    id: 10,
    date: new Date('17 June 2022 GMT+8'),
    title: 'UI Improvements',
    description: `
* Cool new datepicker with day, month, and year views
* Loading indicators for verified field OTPs
* Consistent mobile field styling
    `,
  },
  {
    id: 11,
    date: new Date('17 June 2022 GMT+8'),
    title: 'No more hangups',
    description:
      'With the new Phone Number field, you can quickly collect people’s digits. Local and international validation available.',
    image: {
      url: PhoneFieldFeatureUpdateImg,
      alt: 'Phone Field Feature Update',
    },
  },
  {
    id: 12,
    date: new Date('10 June 2022 GMT+8'),
    title: 'Introducing Workspaces',
    description:
      "A workspace that's never messy. The first thing you see when you log into FormSG is your Workspace. This is where you store and organize all of your forms. Create multiple Workspaces and move your forms into them to stay organised.",
    image: {
      url: WorkspaceFeatureUpdateImg,
      alt: 'Workspace Feature Update',
    },
  },
  {
    id: 13,
    date: new Date('10 June 2022 GMT+8'),
    title: 'UI Improvements',
    description: `
* Cool new datepicker with day, month, and year views
* Loading indicators for verified field OTPs
* Consistent mobile field styling
    `,
  },
  {
    id: 14,
    date: new Date('10 June 2022 GMT+8'),
    title: 'No more hangups',
    description:
      'With the new Phone Number field, you can quickly collect people’s digits. Local and international validation available.',
    image: {
      url: PhoneFieldFeatureUpdateImg,
      alt: 'Phone Field Feature Update',
    },
  },
  {
    id: 15,
    date: new Date('10 June 2022 GMT+8'),
    title: 'Introducing Workspaces',
    description:
      "A workspace that's never messy. The first thing you see when you log into FormSG is your Workspace. This is where you store and organize all of your forms. Create multiple Workspaces and move your forms into them to stay organised.",
    image: {
      url: WorkspaceFeatureUpdateImg,
      alt: 'Workspace Feature Update',
    },
  },
]
