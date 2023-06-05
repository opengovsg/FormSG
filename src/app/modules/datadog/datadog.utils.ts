import tracer from 'dd-trace'

import { IPopulatedForm } from '../../../types'

export const setFormTags = (form: IPopulatedForm) => {
  const span = tracer.scope().active()

  if (span) {
    span.setTag('form.id', `${form._id}`)
    span.setTag('form.adminid', `${form.admin._id}`)
    span.setTag('form.agency.id', `${form.admin.agency._id}`)
    span.setTag('form.agency.shortname', `${form.admin.agency.shortName}`)
  }
}
