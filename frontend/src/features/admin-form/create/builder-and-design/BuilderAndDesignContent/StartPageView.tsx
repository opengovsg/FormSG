import { useCallback, useMemo, useState } from 'react'
import { Box, Flex, Skeleton } from '@chakra-ui/react'

import { FormAuthType, FormLogoState, FormStartPage } from '~shared/types'

import { PREVIEW_MOCK_UINFIN } from '~features/admin-form/preview/constants'
import { useEnv } from '~features/env/queries'
import { FormInstructions } from '~features/public-form/components/FormInstructions/FormInstructions'
import { FormBannerLogo } from '~features/public-form/components/FormStartPage/FormBannerLogo'
import { FormHeader } from '~features/public-form/components/FormStartPage/FormHeader'
import { useFormBannerLogo } from '~features/public-form/components/FormStartPage/useFormBannerLogo'
import { useFormHeader } from '~features/public-form/components/FormStartPage/useFormHeader'

import { useCreatePageSidebar } from '../../common/CreatePageSidebarContext'
import { useCreateTabForm } from '../useCreateTabForm'
import {
  customLogoMetaSelector,
  DesignState,
  setStateSelector,
  startPageDataSelector,
  stateSelector,
  useDesignStore,
} from '../useDesignStore'

export const StartPageView = () => {
  const { data: form } = useCreateTabForm()
  const { designState, startPageData, customLogoMeta, setDesignState } =
    useDesignStore(
      useCallback(
        (state) => ({
          designState: stateSelector(state),
          startPageData: startPageDataSelector(state),
          customLogoMeta: customLogoMetaSelector(state),
          setDesignState: setStateSelector(state),
        }),
        [],
      ),
    )
  const { data: { logoBucketUrl } = {} } = useEnv(
    form?.startPage.logo.state === FormLogoState.Custom,
  )

  const [hoverStartPage, setHoverStartPage] = useState(false)
  const [customLogoPending, setCustomLogoPending] = useState(false)

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
  const { titleColor, titleBg, estTimeString } = useFormHeader({
    startPage,
    hover: hoverStartPage,
  })

  const { hasLogo, logoImgSrc, logoImgAlt } = useFormBannerLogo({
    logoBucketUrl,
    logo: startPage?.logo,
    agency: form?.admin.agency,
  })

  const content = useMemo(() => startPage?.paragraph, [startPage?.paragraph])

  const { handleDesignClick } = useCreatePageSidebar()

  const onHeaderClick = useCallback(() => {
    handleDesignClick()
    setDesignState(DesignState.EditingHeader)
  }, [handleDesignClick, setDesignState])

  const onInstructionsClick = useCallback(() => {
    handleDesignClick()
    setDesignState(DesignState.EditingInstructions)
  }, [handleDesignClick, setDesignState])

  return (
    <>
      <Box
        onPointerEnter={() => setHoverStartPage(true)}
        onPointerLeave={() => setHoverStartPage(false)}
        onClick={onHeaderClick}
        role="button"
        cursor={hoverStartPage ? 'pointer' : 'initial'}
        {...(designState === DesignState.EditingHeader
          ? { border: '2px solid var(--chakra-colors-primary-500)' }
          : { borderY: '2px solid transparent' })}
        borderRadius="4px"
      >
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
            form?.authType !== FormAuthType.NIL
              ? PREVIEW_MOCK_UINFIN
              : undefined
          }
        />
      </Box>
      <Box mt="1.5rem">
        {content ? (
          <Flex justify="center">
            <Box
              w="100%"
              minW={0}
              h="fit-content"
              maxW="57rem"
              bg="white"
              py="2.5rem"
              px={{ base: '1rem', md: '2.5rem' }}
              mb="1.5rem"
            >
              <Box
                p={{ base: '0.75rem', md: '1.5rem' }}
                transition="background 0.2s ease"
                _hover={{ bg: 'secondary.100', cursor: 'pointer' }}
                borderRadius="4px"
                {...(designState === DesignState.EditingInstructions
                  ? {
                      bg: 'secondary.100',
                      border: '2px solid var(--chakra-colors-primary-500)',
                    }
                  : { border: '2px solid white' })}
                onClick={onInstructionsClick}
              >
                <FormInstructions
                  content={content}
                  colorTheme={startPage?.colorTheme}
                />
              </Box>
            </Box>
          </Flex>
        ) : null}
      </Box>
    </>
  )
}
