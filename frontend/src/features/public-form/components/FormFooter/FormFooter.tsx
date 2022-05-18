import { Link as ReactLink } from 'react-router-dom'
import { Box, chakra, Divider, Flex, Link, Stack, Text } from '@chakra-ui/react'

import { ReactComponent as BrandLogoSvg } from '~assets/svgs/brand/brand-hort-colour.svg'
import { PRIVACY_POLICY_ROUTE, TOU_ROUTE } from '~constants/routes'

import { usePublicFormContext } from '~features/public-form/PublicFormContext'

const BrandLogo = chakra(BrandLogoSvg, {
  baseStyle: {
    h: '1.5rem',
    mt: '1rem',
  },
})

/**
 * @precondition Must be nested inside `PublicFormProvider`
 */
export const FormFooter = (): JSX.Element => {
  const { captchaContainerId } = usePublicFormContext()

  return (
    <Stack direction="column" spacing="1.5rem" align="center" pb="1.5rem">
      <Divider w="15rem" />
      <Flex flexDir="column" align="center">
        <Text textStyle="caption-1" color="secondary.400">
          Created with
        </Text>
        <BrandLogo />
      </Flex>
      <Stack direction="row" spacing="1.5rem">
        <Link
          as={ReactLink}
          to={TOU_ROUTE}
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Use
        </Link>
        <Link
          as={ReactLink}
          to={PRIVACY_POLICY_ROUTE}
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </Link>
      </Stack>
      <Box id={captchaContainerId} />
    </Stack>
  )
}
