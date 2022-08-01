import { useMemo } from 'react'
import { Box, Flex, FlexProps, Stack, Text } from '@chakra-ui/react'
import { format } from 'date-fns'

import { FormColorTheme, FormLogoState } from '~shared/types'

import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Button from '~components/Button'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useEnv } from '~features/env/queries'
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
  const backgroundColor = useBgColor(colorTheme)

  return (
    <Flex
      flex={1}
      bg="white"
      justify="center"
      overflow="auto"
      height="100%"
      {...props}
    >
      <Stack w="100%">
        <FormBannerLogo {...formBannerLogoProps} />
        <Flex backgroundColor={backgroundColor} justifyContent="center">
          <ThankYouSvgr h="100%" pt="2.5rem" />
        </Flex>

        <Box px="4rem" pt="3rem">
          <Flex justifyContent="space-between" alignItems="center">
            <Text textStyle="h2" color="secondary.500">
              {endPage?.title}
            </Text>
            <BxsChevronUp color="secondary.500" />
          </Flex>

          <Text
            textStyle="subhead-1"
            color="secondary.500"
            mt="1rem"
            whiteSpace="pre-line"
          >
            {endPage?.paragraph}
          </Text>

          <Text textStyle="subhead-1" color="secondary.500" mt="2.25rem">
            {form?.title ?? 'Form Title'}
          </Text>
          <Text textStyle="body-1" color="neutral.500">
            {form?._id ?? 'Form Identification Number'}
            <br />
            {format(new Date(), 'dd MMM yyyy, h:m aa')}
          </Text>

          <Box mt="2.25rem">
            <Button
              variant="solid"
              colorScheme={`theme-${
                colorTheme ? colorTheme : FormColorTheme.Blue
              }`}
            >
              {endPage?.buttonText}
            </Button>
          </Box>
        </Box>
      </Stack>
    </Flex>
  )
}
