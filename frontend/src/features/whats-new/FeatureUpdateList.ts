import dedent from 'dedent'
import { RequireExactlyOne } from 'type-fest'

import {
  GUIDE_MRF_MODE,
  GUIDE_PAYMENTS_ENTRY,
  GUIDE_SINGPASS_FEATURES,
  GUIDE_SPCP_ESRVCID,
} from '~constants/links'

import Animation2 from './assets/2-payments.json'
import Animation3 from './assets/3-search-and-filter.json'
import Animation4 from './assets/4-dnd.json'
import MyInfoStorageMode from './assets/6-myinfo-storage.svg'
import ChartsSvg from './assets/7-charts_announcement.svg'
import MrfAnimation from './assets/8-mrf_announcement.json'
import MrfEmailNotifications from './assets/9-mrf-email-notifications.gif'
import MrfApprovals from './assets/10-mrf-approvals.gif'
import foldersDashboard from './assets/folders_dashboard.svg'

// image can either be a static image (using url) or an animation (using animationData)
export type FeatureUpdateImage = RequireExactlyOne<
  {
    alt: string
    url: string
    animationData: object
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
  version: 7,
  features: [
    {
      title: 'Use Multi-respondent forms for approval workflows',
      date: new Date('20 Nov 2024 GMT+8'),
      description: dedent`You can now enable approvals from Step 2 onwards using Yes/No fields. This allows you to determine whether an existing workflow should continue based on the approval of the current step.


      For every step that enables this feature, a Yes/No field is required. If Yes is selected, the form continues to the next step. If No is selected, the workflow ends at that step.`,
      image: {
        url: MrfApprovals,
        alt: 'Use Multi-respondent forms for approval workflows',
      },
    },
    {
      title:
        'Email notifications and summary of responses for Multi-respondent forms',
      date: new Date('20 Nov 2024 GMT+8'),
      description: dedent`
      You can now send the email summary of responses and approval outcomes (approved/rejected/completed) to both form respondents and other parties.`,
      image: {
        url: MrfEmailNotifications,
        alt: 'Email notifications and summary of responses for Multi-respondent forms',
      },
    },
    {
      title: 'Enhanced Singpass features for Storage mode forms',
      date: new Date('26 Aug 2024 GMT+8'),
      description: dedent`
      * Limit each NRIC/FIN/UEN to one submission per form 
      * Whitelist respondents by NRIC 
      * Opt out of collecting NRIC of respondents 
      

      Find out more about these optional features [here](${GUIDE_SINGPASS_FEATURES})`,
    },
    {
      title: 'Introducing Multi-respondent forms!',
      date: new Date('04 Apr 2024 GMT+8'),
      description: `Create a workflow to collect responses from multiple respondents in the same form submission. Add multiple steps and assign respondents and fields to each step. See some example workflows [here](${GUIDE_MRF_MODE})`,
      image: {
        animationData: MrfAnimation,
        alt: 'Multi-respondent forms',
      },
    },
    {
      title: 'Introducing Charts',
      date: new Date('21 Nov 2023 GMT+8'),
      description: `You can now visualise data collected on your form and get quick insights through bar charts, pie charts and tables! Find this feature under your form's results. This feature is only available for Storage mode forms.`,
      image: {
        url: ChartsSvg,
        alt: 'Charts for Storage mode forms',
      },
    },
    {
      title: 'Myinfo fields for Storage mode forms',
      date: new Date('16 Nov 2023 GMT+8'),
      description: `Get verified data from respondents by adding Myinfo fields to your Storage mode form. To enable Myinfo fields, select one of our Myinfo-enabled authentication options in your form’s settings. [Learn more](${GUIDE_SPCP_ESRVCID})`,
      image: {
        url: MyInfoStorageMode,
        alt: 'Myinfo fields for Storage mode forms',
      },
    },
    {
      title: 'Introducing Folders!',
      date: new Date('31 Oct 2023 GMT+8'),
      description: `Say hello to a new way of managing your forms! Create folders and organise your forms to find them easily later.`,
      image: {
        url: foldersDashboard,
        alt: 'Introducing Folders!',
      },
    },
    {
      title: 'Collect payments on your form',
      date: new Date('31 May 2023 GMT+8'),
      description: `Respondents can now pay for fees and services directly on your form! We integrate with Stripe to provide reliable payments and hassle-free reconciliations. Payment methods we support include debit / credit cards and PayNow. [Learn more](${GUIDE_PAYMENTS_ENTRY})`,
      image: {
        animationData: Animation2,
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
        animationData: Animation3,
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
        animationData: Animation4,
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
