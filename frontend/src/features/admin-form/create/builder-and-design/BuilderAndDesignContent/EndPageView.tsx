import { useMemo } from 'react'
import { Box, Flex, FlexProps, Stack } from '@chakra-ui/react'

import { FormColorTheme, FormLogoState } from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useEnv } from '~features/env/queries'
import { EndPageBlock } from '~features/public-form/components/FormEndPage/components/EndPageBlock'
import { ThankYouSvgr } from '~features/public-form/components/FormEndPage/components/ThankYouSvgr'
import { FormBannerLogo } from '~features/public-form/components/FormStartPage/FormBannerLogo'
import { useFormBannerLogo } from '~features/public-form/components/FormStartPage/useFormBannerLogo'
import { useBgColor } from '~features/public-form/components/PublicFormWrapper'

import {
  endPageDataSelector,
  useEndPageBuilderStore,
} from '../useEndPageBuilderStore'
import { useDesignColorTheme } from '../utils/useDesignColorTheme'

export const EndPageView = ({ ...props }: FlexProps): JSX.Element => {
  const { data: form } = useAdminForm()
  const endPageFromStore = useEndPageBuilderStore(endPageDataSelector)

  // When drawer is opened, store is populated. We always want the drawer settings
  // to be previewed, so when the store is populated, prioritize that setting.
  const endPage = useMemo(
    () => (endPageFromStore ? endPageFromStore : form?.endPage),
    [endPageFromStore, form?.endPage],
  )
  const { data: { logoBucketUrl } = {} } = useEnv(
    form?.startPage.logo.state === FormLogoState.Custom,
  )

  const formBannerLogoProps = useFormBannerLogo({
    logoBucketUrl,
    logo: form?.startPage.logo,
    agency: form?.admin.agency,
  })

  const colorTheme = useDesignColorTheme()
  const backgroundColor = useBgColor({ colorTheme })

  return (
    <Flex
      mb={0}
      flex={1}
      bg="neutral.200"
      p={{ base: 0, md: '2rem' }}
      justify="center"
      overflow="auto"
      {...props}
    >
      <Stack w="100%" bg="white">
        <FormBannerLogo {...formBannerLogoProps} />
        <Flex backgroundColor={backgroundColor} justifyContent="center">
          <ThankYouSvgr h="100%" pt="2.5rem" />
        </Flex>

        <Box
          py={{ base: '1.5rem', md: '3rem' }}
          px={{ base: '1.5rem', md: '4rem' }}
          w="100%"
        >
          <EndPageBlock
            formTitle={form?.title ?? 'Form Title'}
            endPage={endPage ?? { title: '', buttonText: '' }}
            submissionData={{
              id: form?._id ?? 'Submission ID',
              timeInEpochMs: Date.now(),
            }}
            colorTheme={colorTheme ?? FormColorTheme.Blue}
            isExpandable={false}
          />
        </Box>
      </Stack>
    </Flex>
  )
}
