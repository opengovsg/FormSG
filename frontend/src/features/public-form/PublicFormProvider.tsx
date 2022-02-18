import { useMemo, useRef } from 'react'

import { PUBLICFORM_REGEX } from '~constants/routes'
import { HttpError } from '~services/ApiService'

import { PublicFormContext } from './PublicFormContext'
import { usePublicFormView } from './queries'

interface PublicFormProviderProps {
  formId: string
  children: React.ReactNode
}

export const PublicFormProvider = ({
  formId,
  children,
}: PublicFormProviderProps): JSX.Element => {
  const miniHeaderRef = useRef<HTMLDivElement>(null)

  const { data, error, ...rest } = usePublicFormView(formId)

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
