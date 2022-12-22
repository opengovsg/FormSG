import { Navigate, useParams } from 'react-router-dom'

import { ADMINFORM_ROUTE, ADMINFORM_USETEMPLATE_ROUTE } from '~constants/routes'

export const UseTemplateRedirectPage = (): JSX.Element => {
  const { formId } = useParams()
  if (!formId) {
    throw new Error('Form ID not found')
  }

  return (
    <Navigate
      to={`${ADMINFORM_ROUTE}/${formId}/${ADMINFORM_USETEMPLATE_ROUTE}`}
      replace
    />
  )
}
