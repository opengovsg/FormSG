import PhoneFieldFeatureUpdateImg from './assets/phone_field_feature_update.svg'
import WorkspaceFeatureUpdateImg from './assets/workspaces_feature_update.svg'

export interface FeatureUpdateImage {
  url: string
  alt: string
}
export interface FeatureUpdate {
  date: Date
  title: string
  description: string
  image?: FeatureUpdateImage
}

export interface FeatureUpdateList {
  features: FeatureUpdate[]
  version: number
}

// TODO: Confirm the actual features which will be showcased in the What's New section
// New features should be added at the top of the list.
export const FEATURE_UPDATE_LIST: FeatureUpdateList = {
  // Update version whenever a new feature is added.
  version: 1,
  features: [
    {
      date: new Date('17 June 2022 GMT+8'),
      title: 'UI Improvements',
      description: `
  * Cool new datepicker with day, month, and year views
  * Loading indicators for verified field OTPs
  * Consistent mobile field styling
  `,
    },
    {
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
      date: new Date('17 June 2022 GMT+8'),
      title: 'UI Improvements',
      description: `
* Cool new datepicker with day, month, and year views
* Loading indicators for verified field OTPs
* Consistent mobile field styling
    `,
    },
    {
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
      date: new Date('17 June 2022 GMT+8'),
      title: 'UI Improvements',
      description: `
* Cool new datepicker with day, month, and year views
* Loading indicators for verified field OTPs
* Consistent mobile field styling
    `,
    },
    {
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
      date: new Date('17 June 2022 GMT+8'),
      title: 'UI Improvements',
      description: `
* Cool new datepicker with day, month, and year views
* Loading indicators for verified field OTPs
* Consistent mobile field styling
    `,
    },
    {
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
      date: new Date('10 June 2022 GMT+8'),
      title: 'UI Improvements',
      description: `
* Cool new datepicker with day, month, and year views
* Loading indicators for verified field OTPs
* Consistent mobile field styling
    `,
    },
    {
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
      date: new Date('10 June 2022 GMT+8'),
      title: 'Introducing Workspaces',
      description:
        "A workspace that's never messy. The first thing you see when you log into FormSG is your Workspace. This is where you store and organize all of your forms. Create multiple Workspaces and move your forms into them to stay organised.",
      image: {
        url: WorkspaceFeatureUpdateImg,
        alt: 'Workspace Feature Update',
      },
    },
  ],
}
