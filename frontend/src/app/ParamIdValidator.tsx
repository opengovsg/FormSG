import { useParams } from 'react-router-dom'

import { MONGODB_ID_REGEX } from '~constants/routes'

import NotFoundErrorPage from '~pages/NotFoundError'

interface ParamIdValidatorProps {
  element: React.ReactElement
}

export const ParamIdValidator = ({ element }: ParamIdValidatorProps) => {
  const { formId, submissionId, paymentId } = useParams()

  // Bootstrap route validation as suggested by React Router Docs:
  // https://reactrouter.com/en/main/start/faq#what-happened-to-regexp-routes-paths
  if (
    (formId && !formId.match(MONGODB_ID_REGEX)) ||
    (submissionId && !submissionId.match(MONGODB_ID_REGEX)) ||
    (paymentId && !paymentId.match(MONGODB_ID_REGEX))
  )
    return <NotFoundErrorPage />

  return element
}
