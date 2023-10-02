import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { Flex, Link, Text, VStack } from '@chakra-ui/react'

import { SingpassFullLogoSvgr } from '~assets/svgrs/singpass/SingpassFullLogoSvgr'
import { getSgidAuthUrl } from '~services/AuthService'
import Button from '~components/Button'

const SGID_VALID_ORG_PAGE =
  'https://docs.id.gov.sg/faq-users#as-a-government-officer-why-am-i-not-able-to-login-to-my-work-tool-using-sgid'
export const SgidLoginButton = (): JSX.Element => {
  const { formState } = useForm()

  const handleLoginMutation = useMutation(getSgidAuthUrl, {
    onSuccess: (data) => {
      window.location.assign(data.redirectUrl)
    },
  })
  return (
    <VStack alignItems="start">
      <Button
        isFullWidth
        isLoading={formState.isSubmitting}
        type="submit"
        color="white"
        onClick={() => handleLoginMutation.mutate()}
      >
        <Flex align="center">
          Log in with <SingpassFullLogoSvgr height="1.25rem" /> app
        </Flex>
      </Button>
      <Text>
        For{' '}
        <Link isExternal href={SGID_VALID_ORG_PAGE}>
          select organization
        </Link>
      </Text>
    </VStack>
  )
}
