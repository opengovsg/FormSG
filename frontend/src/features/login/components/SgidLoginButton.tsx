import { useForm } from 'react-hook-form'
import { useMutation } from 'react-query'
import { Box, Flex, Link, Text, VStack } from '@chakra-ui/react'

import { SGID_VALID_ORG_PAGE } from '~shared/constants'

import { SingpassFullLogoSvgr } from '~assets/svgrs/singpass/SingpassFullLogoSvgr'
// import { getSgidAuthUrl } from '~services/AuthService'
import Button from '~components/Button'
import Tooltip from '~components/Tooltip'

export const SgidLoginButton = (): JSX.Element => {
  const { formState } = useForm()

  // const handleLoginMutation = useMutation(getSgidAuthUrl, {
  //   onSuccess: (data) => {
  //     window.location.assign(data.redirectUrl)
  //   },
  // })
  return (
    <VStack alignItems="start">
      <Tooltip
        placement="top"
        label="These are features specific to SG Government and not available on playground."
      >
        <Box width="100%">
          {/* To prevent isDisabled swallowing the mouseover event for tooltip */}
          <Button
            isDisabled
            isFullWidth
            isLoading={formState.isSubmitting}
            type="submit"
            colorScheme="theme-grey"
            onClick={() => {
              // no-op
            }}
            variant="outline"
          >
            <Flex align="center" flexDirection="row">
              <Text color="grey.500">Log in with </Text>
              <SingpassFullLogoSvgr height="1.25rem" />
              <Text color="grey.500"> app</Text>
            </Flex>
          </Button>
        </Box>
      </Tooltip>
      <Text>
        For{' '}
        <Link isExternal href={SGID_VALID_ORG_PAGE}>
          select agencies
        </Link>
      </Text>
    </VStack>
  )
}
