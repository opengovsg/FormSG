import FirstAnnouncement from './assets/1-payments.json'
import SecondAnnouncement from './assets/2-dnd.json'
import ThirdAnnouncement from './assets/3-listview.json'

// When updating this, remember to update the ROLLOUT_ANNOUNCEMENT_KEY_PREFIX with the new date
// so admins will see new announcements.
export const NEW_FEATURES = [
  {
    // Announcement date: 2023-05-31
    title: 'Collect payments on your form',
    description:
      'Citizens can now pay for fees and services directly on your form! We integrate with Stripe to provide reliable payments and hassle-free reconciliations. Payment methods we support include credit card and PayNow.',
    animationData: FirstAnnouncement,
  },
  {
    title: 'Drag-and-drop form creation',
    description:
      'Add and rearrange fields with ease, and see a preview of your form while editing it.',
    animationData: SecondAnnouncement,
  },
  {
    title: 'List view for homepages',
    description:
      'See the important details of all your forms at a glance, in this improved homepage layout.',
    animationData: ThirdAnnouncement,
  },
]
