import { GUIDE_MRF_MODE } from '~constants/links'

import { FeatureUpdateImage } from '~features/whats-new/FeatureUpdateList'

import MrfAnimation from '../../whats-new/assets/8-mrf_announcement.json'
import foldersDashboard from '../../whats-new/assets/folders_dashboard.svg'

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
    // Announcement date: 2024-04-04
    title: 'Workflows',
    description: `Create a workflow to collect responses from multiple respondents in the same form submission. Add multiple steps and assign respondents and fields to each step.`,
    learnMoreLink: GUIDE_MRF_MODE,
    image: {
      animationData: MrfAnimation,
      alt: 'Multi-respondent forms',
    },
  },
  {
    // Announcement date: 2023-10-31
    title: 'Folders',
    description:
      'Create folders and organise your forms to find them easily later.',
    image: {
      url: foldersDashboard,
      alt: 'Dashboard page with folders',
    },
  },
]
