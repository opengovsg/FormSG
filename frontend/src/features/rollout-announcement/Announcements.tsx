import PaymentsAnnouncementGraphic from './assets/payments.json'

// When updating this, remember to update the ROLLOUT_ANNOUNCEMENT_KEY_PREFIX with the new date
// so admins will see new announcements.
export const NEW_FEATURES = [
  {
    // Announcement date: 2023-05-31
    title: 'Collect payments on your form',
    description:
      'Citizens can now pay for fees and services directly on your form! We integrate with Stripe to provide reliable payments and hassle-free reconciliations. Payment methods we support include credit card and PayNow.',
    animationData: PaymentsAnnouncementGraphic,
  },
]
