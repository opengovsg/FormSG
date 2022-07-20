import { useMemo, useState } from 'react'
import { Flex, Skeleton } from '@chakra-ui/react'

import { FormAuthType, FormLogoState, FormStartPage } from '~shared/types'

import { useEnv } from '~features/env/queries'
import { FormBannerLogo } from '~features/public-form/components/FormStartPage/FormBannerLogo'
import { FormHeader } from '~features/public-form/components/FormStartPage/FormHeader'
import { getFormBannerLogoProps } from '~features/public-form/components/FormStartPage/useFormBannerLogo'
import { getFormHeaderDesignProps } from '~features/public-form/components/FormStartPage/useFormHeader'

import { useCreateTabForm } from '../useCreateTabForm'
import {
  customLogoMetaDataSelector,
  startPageInputDataSelector,
  useDesignStore,
} from '../useDesignStore'

export const StartPageView = () => {
  const { data: form } = useCreateTabForm()
  const { data: { logoBucketUrl } = {} } = useEnv()
  const { startPageData, customLogoMeta } = useDesignStore((state) => ({
    startPageData: startPageInputDataSelector(state),
    customLogoMeta: customLogoMetaDataSelector(state),
  }))

  // Color theme options and other design stuff, identical to public form
  const { titleColor, titleBg, estTimeString } = useFormHeader(startPage)
  const [showLogo, setShowLogo] = useState<boolean>(false)

  // Transform the FormStartPageInput into a FormStartPage
  const startPageFromStore: FormStartPage | null = useMemo(() => {
    if (!startPageData) return null
    const { logo, estTimeTaken, ...rest } = startPageData
    const estTimeTakenTransformed =
      estTimeTaken === '' ? undefined : estTimeTaken
    if (logo.state !== FormLogoState.Custom) {
      setShowLogo(true)
      return {
        logo: { state: logo.state },
        estTimeTaken: estTimeTakenTransformed,
        ...rest,
      }
    }
    setShowLogo(!!startPageData?.customLogoFile.srcUrl)
    return {
      logo: {
        state: FormLogoState.Custom,
        // Placeholder values
        fileId: customLogoMeta?.fileId ?? '',
        fileName: customLogoMeta?.fileName ?? '',
        fileSizeInBytes: customLogoMeta?.fileSizeInBytes ?? 0,
      },
      estTimeTaken: estTimeTakenTransformed,
      ...rest,
    }
  }, [startPageData, customLogoMeta])

  // Use store's start page once the store is populated (when user opens drawer)
  const startPage = useMemo(() => {
    if (startPageFromStore) return startPageFromStore
    setShowLogo(true)
    return form?.startPage
  }, [form?.startPage, startPageFromStore])

  const { hasLogo, logoImgSrc, logoImgAlt } = useMemo(
    () =>
      getFormBannerLogoProps({
        logoBucketUrl,
        logo: startPage?.logo,
        agency: form?.admin.agency,
      }),
    [logoBucketUrl, startPage?.logo, form?.admin.agency],
  )

  const { titleColor, titleBg, estTimeString } = useMemo(
    () => getFormHeaderDesignProps(startPage),
    [startPage],
  )

  return (
    <>
      {showLogo ? (
        <FormBannerLogo
          hasLogo={hasLogo}
          logoImgSrc={
            startPageData?.logo.state === FormLogoState.Custom
              ? startPageData?.customLogoFile.srcUrl // manual override for admin to preview custom logo
              : logoImgSrc
          }
          logoImgAlt={logoImgAlt}
        />
      ) : (
        <Flex justify="center" p="1rem" bg="white">
          <Skeleton w="4rem" h="4rem" />
        </Flex>
      )}
      <FormHeader
        title={form?.title}
        estTimeString={estTimeString}
        titleBg={titleBg}
        titleColor={titleColor}
        showHeader
        loggedInId={
          form?.authType !== FormAuthType.NIL ? 'S8899000D' : undefined
        }
      />
    </>
  )
}
