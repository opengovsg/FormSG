import FirstAnnouncement from './assets/1-dnd.json'
import SecondAnnouncement from './assets/2-listview.json'
import ThirdAnnouncement from './assets/3-a11y.json'
import { LogicOrderSvgr } from './assets/LogicOrderSvgr'

export const NEW_FEATURES = [
  {
    title: 'Drag and drop fields to build your form',
    description:
      'Add and arrange fields with ease. Additionally, you can now preview your form while editing it.',
    animationData: FirstAnnouncement,
  },
  {
    title: 'Forms now appear in list view',
    description:
      'Get an overview of your forms in a structured and organised way.',
    animationData: SecondAnnouncement,
  },
  {
    title: 'Form filling is now accessible for visually impaired users',
    description:
      "Form filling should be accessible to everyone. We've prioritised it in the redesign so everyone can have a pleasant form filling experience.",
    animationData: ThirdAnnouncement,
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
