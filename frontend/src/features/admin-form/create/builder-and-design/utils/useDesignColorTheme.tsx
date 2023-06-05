import { useMemo } from 'react'

import { useCreateTabForm } from '../useCreateTabForm'
import { startPageDataSelector, useDesignStore } from '../useDesignStore'

export const useDesignColorTheme = () => {
  const { data: form } = useCreateTabForm()
  const startPageData = useDesignStore(useMemo(() => startPageDataSelector, []))
  const colorTheme = useMemo(
    () =>
      startPageData ? startPageData.colorTheme : form?.startPage.colorTheme,
    [startPageData, form?.startPage.colorTheme],
  )
  return colorTheme
}
