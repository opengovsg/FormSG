import { useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'

import { PUBLICFORM_REGEX } from '~constants/routes'
import { HttpError } from '~services/ApiService'

import { PublicFormContext } from './PublicFormContext'
import { usePublicFormView } from './queries'

interface PublicFormProviderProps {
  children: React.ReactNode
}

export const PublicFormProvider = ({
  children,
}: PublicFormProviderProps): JSX.Element => {
  const miniHeaderRef = useRef<HTMLDivElement>(null)
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { data, error, ...rest } = usePublicFormView()

  const isFormNotFound = useMemo(() => {
    return (
      !PUBLICFORM_REGEX.test(formId) ||
      (error instanceof HttpError && error.code === 404)
    )
  }, [error, formId])

  return (
    <PublicFormContext.Provider
      value={{
        miniHeaderRef,
        formId,
        form: data?.form,
        isIntranetUser: data?.isIntranetUser,
        myInfoError: data?.myInfoError,
        spcpSession: data?.spcpSession,
        error,
        ...rest,
      }}
    >
      {isFormNotFound ? <div>404</div> : children}
    </PublicFormContext.Provider>
  )
}
