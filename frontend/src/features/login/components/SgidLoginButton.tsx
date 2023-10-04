import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { Flex, Link, Text, VStack } from '@chakra-ui/react'

import { SGID_VALID_ORG_PAGE } from '~shared/constants'

import { SingpassFullLogoSvgr } from '~assets/svgrs/singpass/SingpassFullLogoSvgr'
import { getSgidAuthUrl } from '~services/AuthService'
import Button from '~components/Button'

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
