import { HttpError } from '~services/ApiService'

import { usePublicFormView } from './queries'

export const PublicFormPage = (): JSX.Element => {
  const { data, isLoading, error } = usePublicFormView()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error instanceof HttpError && error.code === 404) {
    return <div>404</div>
  }

  return <div>{JSON.stringify(data)}</div>
}
