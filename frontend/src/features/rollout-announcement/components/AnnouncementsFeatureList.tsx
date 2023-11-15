import { GUIDE_PAYMENTS_ENTRY } from '~constants/links'

import { FeatureUpdateImage } from '~features/whats-new/FeatureUpdateList'

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
    // Announcement date: 2023-11-
    title: '',
    description: '',
    image: {
      url: '',
      alt: '',
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
