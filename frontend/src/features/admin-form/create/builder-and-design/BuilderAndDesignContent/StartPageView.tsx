import { useMemo, useState } from 'react'
import { Flex, Skeleton } from '@chakra-ui/react'

import { FormAuthType, FormLogoState, FormStartPage } from '~shared/types'

import { PREVIEW_MOCK_UINFIN } from '~features/admin-form/preview/constants'
import { useEnv } from '~features/env/queries'
import { FormBannerLogo } from '~features/public-form/components/FormStartPage/FormBannerLogo'
import { FormHeader } from '~features/public-form/components/FormStartPage/FormHeader'
import { useFormBannerLogo } from '~features/public-form/components/FormStartPage/useFormBannerLogo'
import { useFormHeader } from '~features/public-form/components/FormStartPage/useFormHeader'

import { useCreateTabForm } from '../useCreateTabForm'
import {
  customLogoMetaSelector,
  startPageDataSelector,
  useDesignStore,
} from '../useDesignStore'

export const StartPageView = () => {
  const { data: form } = useCreateTabForm()
  const { startPageData, customLogoMeta } = useDesignStore((state) => ({
    startPageData: startPageDataSelector(state),
    customLogoMeta: customLogoMetaSelector(state),
  }))
  const { data: { logoBucketUrl } = {} } = useEnv(
    form?.startPage.logo.state === FormLogoState.Custom,
  )

  const [customLogoPending, setCustomLogoPending] = useState<boolean>(false)

  // Transform the FormStartPageInput into a FormStartPage
  const startPageFromStore: FormStartPage | null = useMemo(() => {
    if (!startPageData) return null
    const { logo, estTimeTaken, ...rest } = startPageData
    const estTimeTakenTransformed =
      estTimeTaken === '' ? undefined : estTimeTaken
    if (logo.state !== FormLogoState.Custom) {
      setCustomLogoPending(false)
      return {
        logo: { state: logo.state },
        estTimeTaken: estTimeTakenTransformed,
        ...rest,
      }
    }
    setCustomLogoPending(!startPageData?.attachment.srcUrl)
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

  // When drawer is opened, store is populated. We always want the drawer settings
  // to be previewed, so when the store is populated, prioritize that setting.
  const startPage = useMemo(() => {
    if (startPageFromStore) return startPageFromStore
    setCustomLogoPending(false)
    return form?.startPage
  }, [form?.startPage, startPageFromStore])

  // Color theme options and other design stuff, identical to public form
  const { titleColor, titleBg, estTimeString } = useFormHeader(startPage)

  const { hasLogo, logoImgSrc, logoImgAlt } = useFormBannerLogo({
    logoBucketUrl,
    logo: startPage?.logo,
    agency: form?.admin.agency,
  })

  return (
    <>
      {customLogoPending ? (
        // Show skeleton if user has chosen custom logo but not yet uploaded
        <Flex justify="center" p="1rem" bg="white">
          <Skeleton w="4rem" h="4rem" />
        </Flex>
      ) : (
        <FormBannerLogo
          hasLogo={hasLogo}
          logoImgSrc={
            startPageData?.logo.state === FormLogoState.Custom
              ? startPageData.attachment.srcUrl // manual override to preview custom logo
              : logoImgSrc
          }
          logoImgAlt={logoImgAlt}
        />
      )}
      <FormHeader
        title={form?.title}
        estTimeString={estTimeString}
        titleBg={titleBg}
        titleColor={titleColor}
        showHeader
        loggedInId={
          form?.authType !== FormAuthType.NIL ? PREVIEW_MOCK_UINFIN : undefined
        }
      />
    </>
  )
}
