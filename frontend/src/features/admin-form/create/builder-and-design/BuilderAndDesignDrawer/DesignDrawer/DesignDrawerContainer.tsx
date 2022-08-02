import { useCallback, useEffect } from 'react'

import { FormLogoState } from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useEnv } from '~features/env/queries'

import {
  resetDesignStoreSelector,
  setCustomLogoMetaSelector,
  setStartPageDataSelector,
  startPageDataSelector,
  useDesignStore,
} from '../../useDesignStore'

import { DesignDrawer } from './DesignDrawer'

export const DesignDrawerContainer = (): JSX.Element | null => {
  const { data: { logoBucketUrl } = {} } = useEnv()
  const { data: form } = useAdminForm()

  const {
    startPageData,
    setStartPageData,
    setCustomLogoMeta,
    resetDesignStore,
  } = useDesignStore(
    useCallback(
      (state) => ({
        startPageData: startPageDataSelector(state),
        setStartPageData: setStartPageDataSelector(state),
        setCustomLogoMeta: setCustomLogoMetaSelector(state),
        resetDesignStore: resetDesignStoreSelector(state),
      }),
      [],
    ),
  )

  // Load existing start page and custom logo into drawer form
  useEffect(() => {
    if (!form) return
    setStartPageData({
      ...form.startPage,
      estTimeTaken: form.startPage.estTimeTaken || '',
      attachment:
        form.startPage.logo.state !== FormLogoState.Custom
          ? {}
          : {
              file: Object.defineProperty(
                new File([''], form.startPage.logo.fileName, {
                  type: 'image/jpeg',
                }),
                'size',
                { value: form.startPage.logo.fileSizeInBytes },
              ),
              srcUrl: `${logoBucketUrl}/${form.startPage.logo.fileId}`,
            },
    })
    if (form.startPage.logo.state === FormLogoState.Custom)
      setCustomLogoMeta(form.startPage.logo)
    return resetDesignStore
  }, [
    form,
    logoBucketUrl,
    resetDesignStore,
    setCustomLogoMeta,
    setStartPageData,
  ])

  if (!startPageData) return null

  return <DesignDrawer startPageData={startPageData} />
}
