import { useCallback } from 'react'
import { Icon, Skeleton, VisuallyHidden } from '@chakra-ui/react'

import { FaStripe } from '~assets/icons/FaStripe'
import Button from '~components/Button'

import { useMutateStripeAccount } from '../../mutations'
import { useAdminFormPayments } from '../../queries'

const StripeIcon = () => {
  return (
    <Icon as={FaStripe} top="1px" ml="-2px" pos="relative" fontSize="2.5rem" />
  )
}

export const StripeConnectButton = ({
  isDisabled = false,
}: {
  isDisabled?: boolean
}): JSX.Element => {
  const { data, isLoading } = useAdminFormPayments()

  const { linkStripeAccountMutation, unlinkStripeAccountMutation } =
    useMutateStripeAccount()

  const onLinkAccountClick = useCallback(
    () =>
      linkStripeAccountMutation.mutateAsync(undefined, {
        onSuccess: ({ authUrl }) => {
          window.location.assign(authUrl)
        },
      }),
    [linkStripeAccountMutation],
  )

  const onUnlinkAccountClick = useCallback(
    () => unlinkStripeAccountMutation.mutate(),
    [unlinkStripeAccountMutation],
  )

  if (!data?.account) {
    return (
      <Skeleton isLoaded={!isLoading} w="fit-content">
        <Button
          isDisabled={isDisabled}
          isLoading={linkStripeAccountMutation.isLoading}
          onClick={onLinkAccountClick}
          title="Connect with Stripe"
          bg="#635bff"
          _hover={{
            bg: '#7a73ff',
          }}
        >
          Connect with my Stripe Account
        </Button>
      </Skeleton>
    )
  }

  return (
    <Button
      colorScheme="danger"
      onClick={onUnlinkAccountClick}
      isLoading={unlinkStripeAccountMutation.isLoading}
      rightIcon={<StripeIcon />}
    >
      Disconnect
      <VisuallyHidden>Stripe</VisuallyHidden>
    </Button>
  )
}
