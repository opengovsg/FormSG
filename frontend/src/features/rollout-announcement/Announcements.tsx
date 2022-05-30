import FirstAnnouncement from './assets/1-dnd.json'
import SecondAnnouncement from './assets/2-listview.json'
import ThirdAnnouncement from './assets/3-a11y.json'
import { LogicOrderSvgr } from './assets/LogicOrderSvgr'
import { SectionSvgr } from './assets/SectionSvgr'
import { TwilioSvgr } from './assets/TwilioSvgr'

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
    title:
      'Logic is now ordered by question number so you can find your conditions easily',
    ImageSvgr: <LogicOrderSvgr />,
  },
  {
    title:
      'Add your Twilio credentials so your end-users can verify their mobile number',
    ImageSvgr: <TwilioSvgr />,
  },
  {
    title:
      'Create Sections to make creating repetitive fields easier, and to segment your form so your users can process information easily',
    ImageSvgr: <SectionSvgr />,
  },
]
