import { useMutation } from 'react-query'

import { sendOnboardingEmail } from '~services/LandingPaymentService'

export const useMutatePaymentsOnboarding = () => {
  return {
    sendOnboardingEmailMutation: useMutation(({ email }: { email: string }) =>
      sendOnboardingEmail(email),
    ),
  }
}
