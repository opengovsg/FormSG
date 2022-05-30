interface FeatureTourStepAttributes {
  id: string
  title: string
  content: string
}

type FeatureStep = 'FIRST_STEP' | 'SECOND_STEP' | 'THIRD_STEP'

export const FEATURE_TOUR: Record<FeatureStep, FeatureTourStepAttributes> = {
  FIRST_STEP: {
    id: 'feature_tour_first_step',
    title: 'Build your form',
    content: 'Create forms easily by dragging and dropping fields',
  },
  SECOND_STEP: {
    id: 'feature_tour_second_step',
    title: 'Design your form',
    content:
      'Change your agency logo, theme colours, layout and add Instructions for your page',
  },
  THIRD_STEP: {
    id: 'feature_tour_third_step',
    title: 'Add Logic to your form',
    content:
      "Personalise your user's experience by showing fields and sections, or disabling submissions based on their input",
  },
}
