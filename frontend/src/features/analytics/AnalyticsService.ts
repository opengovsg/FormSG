import { FormStatus, PublicFormDto } from '~shared/types/form'

const gtag = window?.gtag

export const trackAdminLogin = () => {
  if (!gtag) return
  gtag('event', 'login', {
    event_category: 'admin_login',
  })
}

export const trackAdminLoginFailure = (error: string) => {
  if (!gtag) return
  gtag('event', 'login', {
    event_category: 'admin_login_failure',
    message: error,
  })
}

const trackPublicFormEvent = (
  eventCategory: string,
  form: PublicFormDto,
  others?: Record<string, unknown>,
) => {
  if (!gtag || form.status !== FormStatus.Public) return
  gtag('event', 'public_form', {
    event_category: eventCategory,
    event_label: `${form.title} ${form._id}`,
    form_id: form._id,
    ...others,
  })
}

export const trackVisitPublicForm = (form: PublicFormDto) => {
  return trackPublicFormEvent('visit', form)
}
