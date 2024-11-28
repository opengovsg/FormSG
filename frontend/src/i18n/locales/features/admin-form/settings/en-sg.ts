import { enSG as emailNotifications } from './email-notifications'
import { enSG as general } from './general'
import { enSG as webhooks } from './webhooks'

export const enSG = {
  general,
  singpass: {
    title: 'Singpass',
  },
  emailNotifications,
  webhooks,
  payments: {
    title: 'Payments',
  },
}
