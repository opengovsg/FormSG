import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { FormResponseMode } from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useFormResponsesCount } from '../../queries'

import { StorageResponsesContext } from './StorageResponsesContext'
import { useSecretKey } from './useSecretKey'

export const StorageResponsesProvider = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { data: form, isLoading: isAdminFormLoading } = useAdminForm()
  const { data: responsesCount, isLoading: isFormResponsesLoading } =
    useFormResponsesCount()
  const [secretKey, setSecretKey] = useSecretKey(formId)

  const formPublicKey = useMemo(() => {
    if (!form || form.responseMode !== FormResponseMode.Encrypt) return null
    return form.publicKey
  }, [form])

  const downloadParams = useMemo(() => {
    if (!secretKey) return null

    return {
      secretKey,
      // TODO: Add selector for start and end dates.
      endDate: undefined,
      startDate: undefined,
    }
  }, [secretKey])

  return (
    <StorageResponsesContext.Provider
      value={{
        isLoading: isAdminFormLoading || isFormResponsesLoading,
        formPublicKey,
        responsesCount,
        downloadParams,
        secretKey,
        setSecretKey,
      }}
    >
      {children}
    </StorageResponsesContext.Provider>
  )
}
