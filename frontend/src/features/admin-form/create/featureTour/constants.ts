import { Step } from 'react-joyride'

interface FeatureTourStepAttributes {
  id: string
  title: string
  content: string
}

export const FEATURE_TOUR: FeatureTourStepAttributes[] = [
  {
    id: 'feature_tour_first_step',
    title: 'Add fields',
    content: 'Add fields to your form by dragging and dropping them.',
  },
  {
    id: 'feature_tour_second_step',
    title: 'Edit header and instructions',
    content:
      'Change your agency logo, theme colours, layout and add instructions to your form.',
  },
  {
    id: 'feature_tour_third_step',
    title: 'Add logic',
    content: 'Decide what fields or sections a user sees based on their input.',
  },
  {
    id: 'feature_tour_fourth_step',
    title: 'Edit Thank you page',
    content:
      'Customise your thank you message and add follow-up instructions that users can see after they submit your form.',
  },
]

export const FEATURE_STEPS: Step[] = FEATURE_TOUR.map(
  ({ id, title, content }) => {
    return {
      target: `#${id}`,
      title: title,
      content: content,
      disableBeacon: true,
    }
  },
)
