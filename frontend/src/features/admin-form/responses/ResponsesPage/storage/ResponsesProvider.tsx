import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { FormResponseMode } from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useFormResponsesCount } from '../../queries'

import { useSecretKey } from './hooks/useSecretKey'
import {
  DownloadEncryptedParams,
  StorageResponsesContext,
} from './StorageResponsesContext'

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

  const downloadParams: DownloadEncryptedParams | null = useMemo(() => {
    if (!form || !secretKey || form.responseMode !== FormResponseMode.Encrypt) {
      return null
    }
    return {
      formId,
      formTitle: form.title,
      secretKey,
    }
  }, [form, formId, secretKey])

  return (
    <StorageResponsesContext.Provider
      value={{
        isLoading: isAdminFormLoading || isFormResponsesLoading,
        downloadParams,
        formPublicKey,
        responsesCount,
        secretKey,
        setSecretKey,
      }}
    >
      {children}
    </StorageResponsesContext.Provider>
  )
}
