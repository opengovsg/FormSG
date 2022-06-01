import { Step } from 'react-joyride'

interface FeatureTourStepAttributes {
  id: string
  title: string
  content: string
}

export const FEATURE_TOUR: FeatureTourStepAttributes[] = [
  {
    id: 'feature_tour_first_step',
    title: 'Build your form',
    content: 'Create forms easily by dragging and dropping fields',
  },
  {
    id: 'feature_tour_second_step',
    title: 'Design your form',
    content:
      'Change your agency logo, theme colours, layout and add Instructions for your page',
  },
  {
    id: 'feature_tour_third_step',
    title: 'Add Logic to your form',
    content:
      "Personalise your user's experience by showing fields and sections, or disabling submissions based on their input",
  },
]

export const FEATURE_STEPS = FEATURE_TOUR.map<Step>(
  ({ id, title, content }) => {
    return {
      target: `#${id}`,
      title: title,
      content: content,
      disableBeacon: true,
    }
  },
)
