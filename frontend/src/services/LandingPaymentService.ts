import { ApiService } from './ApiService'

export const sendOnboardingEmail = async (email: string) =>
  ApiService.post('/payments/onboarding', { email }).then((data) => data)
