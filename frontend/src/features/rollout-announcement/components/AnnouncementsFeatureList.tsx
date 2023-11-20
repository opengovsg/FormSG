import { GUIDE_PAYMENTS_ENTRY, GUIDE_SPCP_ESRVCID } from '~constants/links'

import { FeatureUpdateImage } from '~features/whats-new/FeatureUpdateList'

import myInfoStorageMode from '../../whats-new/assets/6-myinfo-storage.svg'
import ChartsSvg from '../../whats-new/assets/7-charts_announcement.svg'
import foldersDashboard from '../../whats-new/assets/folders_dashboard.svg'
import PaymentsAnnouncementGraphic from '../assets/payments_announcement.svg'

export interface NewFeature {
  title: string
  description: string
  learnMoreLink?: string
  image: FeatureUpdateImage
}
// When updating this, remember to update the ROLLOUT_ANNOUNCEMENT_KEY_PREFIX with the new date
// so admins will see new announcements.
export const NEW_FEATURES: NewFeature[] = [
  {
    // Announcement date: 2023-11-21
    title: 'Introducing Charts',
    description:
      "You can now visualise data collected on your form and get quick insights through bar charts, pie charts and tables! Find this feature under your form's results. This feature is only available for Storage mode forms.",
    image: {
      url: ChartsSvg,
      alt: 'Charts for Storage mode forms',
    },
  },
  {
    // Announcement date: 2023-11-16
    title: 'Myinfo fields for Storage mode forms',
    description:
      'Get verified data from respondents by adding Myinfo fields to your Storage mode form. To enable Myinfo fields, select one of our Myinfo-enabled authentication options in your form’s settings.',
    learnMoreLink: GUIDE_SPCP_ESRVCID,
    image: {
      url: myInfoStorageMode,
      alt: 'Myinfo fields for Storage mode forms',
    },
  },
  {
    // Announcement date: 2023-10-31
    title: 'Introducing Folders!',
    description:
      'Say hello to a new way of managing your forms! Create folders and organise your forms to find them easily later.',
    image: {
      url: foldersDashboard,
      alt: 'Dashboard page with folders',
    },
  },
  {
    // Announcement date: 2023-05-31
    title: 'Collect payments on your form',
    description:
      'Respondents can now pay for fees and services directly on your form! We integrate with Stripe to provide reliable payments and hassle-free reconciliations. Payment methods we support include debit / credit cards and PayNow.',
    learnMoreLink: GUIDE_PAYMENTS_ENTRY,
    image: {
      url: PaymentsAnnouncementGraphic,
      alt: 'Collect payments on your form',
    },
  },
]
