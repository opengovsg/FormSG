import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useMutation } from 'react-query'
import { Flex, Link, Text, VStack } from '@chakra-ui/react'

import { SGID_VALID_ORG_PAGE } from '~shared/constants'

import { SingpassFullLogoSvgr } from '~assets/svgrs/singpass/SingpassFullLogoSvgr'
import { getSgidAuthUrl } from '~services/AuthService'
import Button from '~components/Button'

export const SgidLoginButton = (): JSX.Element => {
  const { formState } = useForm()
  const { t } = useTranslation()

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
          <Text color="primary.500">
            {`${t('features.login.components.SgidLoginButton.loginText')} `}
          </Text>
          <SingpassFullLogoSvgr height="1.25rem" />
          <Text color="primary.500">
            {` ${t('features.login.components.SgidLoginButton.appText')}`}
          </Text>
        </Flex>
      </Button>
      <Text>
        {`${t('features.login.components.SgidLoginButton.forText')} `}
        <Link isExternal href={SGID_VALID_ORG_PAGE}>
          {t('features.login.components.SgidLoginButton.selectAgenciesText')}
        </Link>
      </Text>
    </VStack>
  )
}
