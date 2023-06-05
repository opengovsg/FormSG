import dedent from 'dedent'
import { JsonObject, RequireExactlyOne } from 'type-fest'

import Animation1 from './assets/1-payments.json'
import Animation2 from './assets/2-search-and-filter.json'
import Animation3 from './assets/3-dnd.json'

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
  version: 3,
  features: [
    {
      title: 'Collect payments on your form',
      date: new Date('31 May 2023 GMT+8'),
      description:
        'Citizens can now pay for fees and services directly on your form! We integrate with Stripe to provide reliable payments and hassle-free reconciliations. Payment methods we support include debit / credit cards and PayNow.',
      image: {
        animationData: Animation1,
        alt: 'Collect payments on your form',
      },
    },
    {
      title: 'Find your forms quickly by',
      date: new Date('14 December 2022 GMT+8'),
      description: dedent`
        * Searching keywords to find what you need
        * Applying filters to narrow down results
      `,
      image: {
        animationData: Animation2,
        alt: 'Search and filter your forms',
      },
    },
    {
      title: 'The new FormSG experience',
      date: new Date('12 October 2022 GMT+8'),
      description: dedent`
        * Your forms now appear in a list so you can find your important forms faster
        * The new drag-and-drop form builder helps you easily rearrange your form fields


        Notice anything wrong? Let us know by using the feedback button at the bottom-right of the screen.
      `,
      image: {
        animationData: Animation3,
        alt: 'The new FormSG experience',
      },
    },
    {
      title: 'Big little improvements',
      date: new Date('12 October 2022 GMT+8'),
      description: dedent`
      * Easily paste options into Radio fields
      * Add your Twilio credentials so form-fillers can verify their mobile number
      * Enhanced security to prevent malicious inputs in form responses, [read more about it here](https://formsg.gitbook.io/form-user-guide/faq/faq/storage-mode#why-do-i-have-an-additional-quote-in-some-of-my-responses)
      `,
    },
  ],
}
