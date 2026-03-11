import { delay as MswDelay, http, HttpResponse } from 'msw'

export const otpGenerationResponse = ({
  isInvalid = false,
}: { isInvalid?: boolean } = {}): ReturnType<(typeof http)['post']> => {
  return http.post<never, { email: string }, string>(
    '/api/v3/auth/otp/generate',
    async ({ request }) => {
      const body = await request.json()
      await MswDelay()
      return HttpResponse.json(
        isInvalid
          ? 'This is not a whitelisted public service email domain. Please log in with your official government or government-linked email address.'
          : `OTP sent to ${body.email}`,
        { status: isInvalid ? 401 : 200 },
      )
    },
  )
}

export const authHandlers = [
  otpGenerationResponse(),
  http.post<never, { email: string; otp: string }>(
    '/api/v3/auth/otp/verify',
    async ({ request }) => {
      const body = await request.json()

      if (body.otp === '123456') {
        await MswDelay()
        return new HttpResponse({ status: 200 })
      }
      await MswDelay()
      return HttpResponse.json({ message: 'Wrong OTP' }, { status: 401 })
    },
  ),
  http.get('/api/v3/auth/logout', async () => {
    await MswDelay()
    return HttpResponse.json(
      { message: 'Sign out successful' },
      { status: 200 },
    )
  }),
]
