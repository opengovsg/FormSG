import { BuildFormSvgr } from './components/BuildFormSvgr'
import { LogicOrderSvgr } from './components/LogicOrderSvgr'

/**
 * TODO (hanstirtaputra):
 * Update ImageSvgrs to the animations when it's completed
 */
export const NEW_FEATURES = [
  {
    title: 'Drag and drop fields to build your form',
    description:
      'Add and arrange fields with ease. Additionally, you can now preview your form while editing it.',
    ImageSvgr: <BuildFormSvgr />,
  },
  {
    title: 'Forms now appear in list view',
    description:
      'Get an overview of your forms in a structured and organised way.',
    ImageSvgr: <BuildFormSvgr />,
  },
  {
    title: 'Form filling is now accessible for visually impaired users',
    description:
      "Form filling should be accessible to everyone. We've prioritised it in the redesign so everyone can have a pleasant form filling experience.",
    ImageSvgr: <BuildFormSvgr />,
  },
]

export const OTHER_UPDATES = [
  {
    title: 'Logic is now ordered by question number',
    description: [
      'Find logic conditions easily',
      'Manage logic in your form more efficiently',
    ],
    ImageSvgr: <LogicOrderSvgr />,
  },
  {
    title: 'Add your Twilio credentials for SMS verification',
    description: ['Support your organisations needs for more SMS verification'],
    ImageSvgr: <LogicOrderSvgr />,
  },
]
