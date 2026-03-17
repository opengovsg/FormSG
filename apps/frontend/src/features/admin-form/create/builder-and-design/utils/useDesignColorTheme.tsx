import { useMemo } from 'react'

import { FormColorTheme } from 'formsg-shared/types'

import { useCreateTabForm } from '../useCreateTabForm'
import { startPageDataSelector, useDesignStore } from '../useDesignStore'

export const useDesignColorTheme = (): FormColorTheme | undefined => {
  const { data: form } = useCreateTabForm()
  const startPageData = useDesignStore(useMemo(() => startPageDataSelector, []))
  const colorTheme = useMemo(
    () =>
      startPageData ? startPageData.colorTheme : form?.startPage.colorTheme,
    [startPageData, form?.startPage.colorTheme],
  )
  return colorTheme
}
