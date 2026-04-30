import { Step } from 'react-joyride'

import i18n from '~/i18n/i18n'

export const USE_TEMPLATE_TOUR_TARGET_ID = 'use-template-button'
export const USE_TEMPLATE_TOUR_STICKY_TARGET_ID = 'use-template-button-sticky'

export const getUseTemplateTourSteps = (stickyActive: boolean): Step[] => {
  const targetId = stickyActive
    ? USE_TEMPLATE_TOUR_STICKY_TARGET_ID
    : USE_TEMPLATE_TOUR_TARGET_ID
  return [
    {
      target: `#${targetId}`,
      title: i18n.t(
        'features.adminForm.template.useTemplateTour.steps.0.title',
      ) as string,
      content: i18n.t(
        'features.adminForm.template.useTemplateTour.steps.0.content',
      ) as string,
      disableBeacon: true,
    },
  ]
}
