import { AdminForbiddenError } from '.'

export const enSG: AdminForbiddenError = {
  title: 'Forbidden',
  header: 'You do not have access to this page.',
  description: 'Log in, or contact the owner of the form for more information.',
  buttons: {
    back: 'Back',
    dashboard: 'Go to dashboard',
    login: 'Log in',
  },
}
