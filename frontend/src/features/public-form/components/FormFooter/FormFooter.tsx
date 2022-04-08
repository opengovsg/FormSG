import { chakra, Divider, Flex, Link, Stack, Text } from '@chakra-ui/react'

import { ReactComponent as BrandLogoSvg } from '~assets/svgs/brand/brand-hort-colour.svg'

const BrandLogo = chakra(BrandLogoSvg, {
  baseStyle: {
    h: '1.5rem',
    mt: '1rem',
  },
})

export const FormFooter = (): JSX.Element => {
  return (
    <Stack
      direction="column"
      spacing="1.5rem"
      align="center"
      pt="4rem"
      pb="1.5rem"
    >
      <Divider w="15rem" />
      <Flex flexDir="column" align="center">
        <Text textStyle="caption-1" color="secondary.400">
          Created with
        </Text>
        <BrandLogo />
      </Flex>
      <Stack direction="row" spacing="1.5rem">
        <Link textStyle="body-2">Terms of Use</Link>
        <Link textStyle="body-2">Privacy Policy</Link>
      </Stack>
    </Stack>
  )
}
