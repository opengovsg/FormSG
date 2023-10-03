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
        color="primary"
        onClick={() => handleLoginMutation.mutate()}
        variant="outline"
      >
        <Flex align="center" flexDirection="row">
          <Text color="primary.500">Log in with </Text>
          <SingpassFullLogoSvgr height="1.25rem" />
          <Text color="primary.500"> app</Text>
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
