import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BiCog } from 'react-icons/bi'
import { Box, ButtonGroup, Collapse, Flex, IconButton } from '@chakra-ui/react'

import { FormAuthType, FormLogoState, FormStartPage } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'

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
import {
  isDirtySelector,
  setToInactiveSelector,
  useFieldBuilderStore,
} from '../useFieldBuilderStore'

export const StartPageView = () => {
  const isMobile = useIsMobile()
  const { data: form } = useCreateTabForm()
  const { setToInactive, isDirty } = useFieldBuilderStore(
    useCallback(
      (state) => ({
        setToInactive: setToInactiveSelector(state),
        isDirty: isDirtySelector(state),
      }),
      [],
    ),
  )

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

  // Transform the FormStartPageInput into a FormStartPage
  const startPageFromStore: FormStartPage | null = useMemo(() => {
    if (!startPageData) return null
    const { logo, estTimeTaken, ...rest } = startPageData
    const estTimeTakenTransformed =
      estTimeTaken === '' ? undefined : estTimeTaken
    if (logo.state !== FormLogoState.Custom) {
      return {
        logo: { state: logo.state },
        estTimeTaken: estTimeTakenTransformed,
        ...rest,
      }
    }
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
    return form?.startPage
  }, [form?.startPage, startPageFromStore])

  // Color theme options and other design stuff, identical to public form
  const { logoImgSrc, ...formBannerLogoProps } = useFormBannerLogo({
    logoBucketUrl,
    logo: startPage?.logo,
    agency: form?.admin.agency,
  })
  const formHeaderProps = useFormHeader({ startPage, hover: hoverStartPage })

  const headerRef = useRef<HTMLDivElement | null>(null)
  const instructionsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (designState === DesignState.EditingHeader) {
      headerRef.current?.scrollIntoView({ block: 'nearest' })
    }
    if (designState === DesignState.EditingInstructions) {
      instructionsRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [designState])

  const { handleDesignClick } = useCreatePageSidebar()

  const handleHeaderClick = useCallback(() => {
    if (isDirty) {
      return setDesignState(DesignState.EditingHeader, true)
    }

    setDesignState(DesignState.EditingHeader)
    setToInactive()
    handleDesignClick()
  }, [handleDesignClick, isDirty, setDesignState, setToInactive])

  const handleInstructionsClick = useCallback(() => {
    setDesignState(DesignState.EditingInstructions)
    setToInactive()
    if (!isMobile) handleDesignClick()
  }, [handleDesignClick, isMobile, setDesignState, setToInactive])

  const handleEditInstructionsClick = useCallback(() => {
    if (isMobile) handleDesignClick()
  }, [handleDesignClick, isMobile])

  const headerWrapperEditProps = useMemo(() => {
    switch (designState) {
      case DesignState.EditingHeader:
        return {
          border: '2px solid var(--chakra-colors-primary-500)',
          m: '-2px',
          borderRadius: '4px',
        }
    }
  }, [designState])

  return (
    <>
      <Box
        onPointerEnter={() => setHoverStartPage(true)}
        onPointerLeave={() => setHoverStartPage(false)}
        onClick={handleHeaderClick}
        role="button"
        cursor="pointer"
        {...headerWrapperEditProps}
        overflow="hidden"
        ref={headerRef}
      >
        <FormBannerLogo
          logoImgSrc={
            startPageData?.logo.state === FormLogoState.Custom
              ? startPageData.attachment.srcUrl // manual override to preview custom logo
              : logoImgSrc
          }
          {...formBannerLogoProps}
        />
        <FormHeader
          title={form?.title}
          showHeader
          loggedInId={
            form && form.authType !== FormAuthType.NIL
              ? PREVIEW_MOCK_UINFIN
              : undefined
          }
          {...formHeaderProps}
        />
      </Box>
      {startPage?.paragraph ? (
        <Box>
          <Flex
            flexDir="column"
            align="center"
            w="100%"
            px={{ base: 0, md: '1.5rem', lg: '2.5rem' }}
            mb={{ base: '1.5rem', md: 0 }}
          >
            <Box
              w="100%"
              minW={0}
              h="fit-content"
              maxW="57rem"
              bg="white"
              py="2.5rem"
              px="1.5rem"
            >
              <Box
                transition="background 0.2s ease"
                _hover={{ bg: 'secondary.100', cursor: 'pointer' }}
                borderRadius="4px"
                {...(designState === DesignState.EditingInstructions
                  ? {
                      bg: 'secondary.100',
                      border: '2px solid var(--chakra-colors-primary-500)',
                    }
                  : { border: '2px solid white' })}
                onClick={handleInstructionsClick}
                ref={instructionsRef}
              >
                <Box p={{ base: '0.75rem', md: '1.5rem' }}>
                  <FormInstructions
                    content={startPage?.paragraph}
                    colorTheme={startPage?.colorTheme}
                  />
                </Box>
                {isMobile ? (
                  <Collapse
                    in={designState === DesignState.EditingInstructions}
                    style={{ width: '100%' }}
                  >
                    <Flex
                      px={{ base: '0.75rem', md: '1.5rem' }}
                      flex={1}
                      borderTop="1px solid var(--chakra-colors-neutral-300)"
                      justify="flex-end"
                    >
                      <ButtonGroup
                        variant="clear"
                        colorScheme="secondary"
                        spacing={0}
                      >
                        <IconButton
                          variant="clear"
                          colorScheme="secondary"
                          aria-label="Edit field"
                          icon={<BiCog fontSize="1.25rem" />}
                          onClick={handleEditInstructionsClick}
                        />
                      </ButtonGroup>
                    </Flex>
                  </Collapse>
                ) : null}
              </Box>
            </Box>
          </Flex>
        </Box>
      ) : null}
    </>
  )
}
