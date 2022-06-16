import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { DateString, FormResponseMode } from '~shared/types'

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

  const [dateRange, setDateRange] = useState<DateString[]>([])
  const { data: totalResponsesCount, isLoading: isFormResponsesLoading } =
    useFormResponsesCount()
  const {
    data: dateRangeResponsesCount,
    isLoading: isDateRangeResponsesCountLoading,
  } = useFormResponsesCount({
    startDate: dateRange?.[0],
    endDate: dateRange?.[1],
  })
  const [secretKey, setSecretKey] = useSecretKey(formId)

  const formPublicKey = useMemo(() => {
    if (!form || form.responseMode !== FormResponseMode.Encrypt) return null
    return form.publicKey
  }, [form])

  const downloadParams = useMemo(() => {
    if (!secretKey) return null

    return {
      secretKey,
      startDate: dateRange[0],
      endDate: dateRange[1],
    }
  }, [dateRange, secretKey])

  return (
    <StorageResponsesContext.Provider
      value={{
        isLoading:
          isAdminFormLoading ||
          isFormResponsesLoading ||
          isDateRangeResponsesCountLoading,
        formPublicKey,
        totalResponsesCount,
        dateRangeResponsesCount,
        downloadParams,
        secretKey,
        setSecretKey,
        dateRange,
        setDateRange,
      }}
    >
      {children}
    </StorageResponsesContext.Provider>
  )
}
