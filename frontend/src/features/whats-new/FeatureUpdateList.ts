import dedent from 'dedent'
import { JsonObject, RequireExactlyOne } from 'type-fest'

import WhatsNewAnimationData from './assets/1-dnd.json'

export type FeatureUpdateImage = RequireExactlyOne<
  {
    alt: string
    url: string
    animationData: JsonObject
  },
  'url' | 'animationData'
>
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

// New features should be added at the top of the list.
export const FEATURE_UPDATE_LIST: FeatureUpdateList = {
  // Update version whenever a new feature is added.
  version: 1,
  features: [
    {
      title: 'The new FormSG experience',
      date: new Date('17 August 2022 GMT+8'),
      description: dedent`
        * Your forms now appear in a list so you can find your important forms faster
        * The new drag-and-drop form builder helps you easily rearrange your form fields  \n &nbsp;
        Notice anything wrong? Let us know by using the feedback button at the bottom-right of the screen.
      `,
      image: {
        animationData: WhatsNewAnimationData,
        alt: 'The new FormSG experience',
      },
    },
  ],
}
