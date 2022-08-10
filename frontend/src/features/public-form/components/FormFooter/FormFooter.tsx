import { Box, Flex, Stack } from '@chakra-ui/react'

import { AppFooter } from '~/app/AppFooter'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

import { useBgColor } from '../PublicFormWrapper'

/**
 * @precondition Must be nested inside `PublicFormProvider`
 */
export const FormFooter = (): JSX.Element => {
  const { captchaContainerId, form } = usePublicFormContext()
  const bgColor = useBgColor({
    colorTheme: form?.startPage.colorTheme,
    isFooter: true,
  })

  return (
    <Flex justify="center" w="100%">
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
                bg: bgColor,
              }}
            />
          </Box>
        </Stack>
      </Box>
    </Flex>
  )
}
