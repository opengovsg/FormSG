import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { FormResponseMode } from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useFormResponsesCount } from '../queries'
import useDecryptionWorkers from '../useDecryptionWorkers'

import { ResponsesContext } from './ResponsesContext'

export const ResponsesProvider = ({
  children,
}: {
  children: React.ReactNode
}): JSX.Element => {
  const { formId } = useParams()
  const { downloadEncryptedResponses } = useDecryptionWorkers()

  const { data: form, isLoading: isAdminFormLoading } = useAdminForm()
  const { data: responsesCount, isLoading: isFormResponsesLoading } =
    useFormResponsesCount()
  const [secretKey, setSecretKey] = useState<string>()

  const handleExportCsv = useCallback(() => {
    if (!formId || !form?.title || !secretKey) return
    return downloadEncryptedResponses(formId, form.title, secretKey)
  }, [downloadEncryptedResponses, formId, secretKey, form?.title])

  const formPublicKey = useMemo(() => {
    if (!form || form.responseMode !== FormResponseMode.Encrypt) return null
    return form.publicKey
  }, [form])

  return (
    <ResponsesContext.Provider
      value={{
        isLoading: isAdminFormLoading || isFormResponsesLoading,
        formPublicKey,
        responsesCount,
        handleExportCsv,
        secretKey,
        setSecretKey,
      }}
    >
      {children}
    </ResponsesContext.Provider>
  )
}
