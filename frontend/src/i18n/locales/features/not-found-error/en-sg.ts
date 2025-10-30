import { NotFoundError } from './index'

export const enSG: NotFoundError = {
  title: 'Not found',
  header: 'This page could not be found.',
  buttons: {
    back: 'Back',
    dashboard: 'Go to dashboard',
  },
}
