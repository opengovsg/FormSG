import { useMemo } from 'react'
import { Box, Flex, Spacer, Stack, useBreakpointValue } from '@chakra-ui/react'
import { isEmpty } from 'lodash'

import { AppFooter } from '~/app/AppFooter'

import { useDesignColorTheme } from '~features/admin-form/create/builder-and-design/utils/useDesignColorTheme'
import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useBgColor } from '../PublicFormWrapper'

/**
 * @precondition Must be nested inside `PublicFormProvider`
 */
export const FormFooter = (): JSX.Element => {
  const { captchaContainerId, sectionScrollData } = usePublicFormContext()

  const isDesktop = useBreakpointValue({ base: false, xs: false, lg: true })
  const bgColor = useBgColor(useDesignColorTheme())

  const showSpacer = useMemo(
    () => isDesktop && !isEmpty(sectionScrollData),
    [isDesktop, sectionScrollData],
  )

  return (
    <Flex justify="center" w="100%">
      {showSpacer ? <Spacer minW="20%" /> : null}
      <Box w="100%" minW={0} h="fit-content" maxW="57rem">
        <Stack
          direction="column"
          spacing="1.5rem"
          align="center"
          mx={{ md: '-1.5rem', lg: 0 }}
          mb={{ md: '-1.5rem', lg: '2rem' }}
        >
          <Box id={captchaContainerId} />
          <Box w="100%">
            <AppFooter
              variant="compact"
              containerProps={{
                bgColorScheme: bgColor,
              }}
            />
          </Box>
        </Stack>
      </Box>
      {showSpacer ? <Spacer /> : null}
    </Flex>
  )
}
