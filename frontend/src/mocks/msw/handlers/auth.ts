import { rest } from 'msw'

export const otpGenerationResponse = ({
  isInvalid = false,
}: { isInvalid?: boolean } = {}): ReturnType<typeof rest['post']> => {
  return rest.post<{ email: string }, never, string>(
    '/api/v3/auth/otp/generate',
    (req, res, ctx) => {
      return res(
        ctx.delay(),
        ctx.status(isInvalid ? 401 : 200),
        ctx.json(
          isInvalid
            ? 'This is not an allowlisted public service email domain. Please log in with your official government or government-linked email address.'
            : `OTP sent to ${req.body.email}`,
        ),
      )
    },
  )
}

export const authHandlers = [
  otpGenerationResponse(),
  rest.post<{ email: string; otp: string }>(
    '/api/v3/auth/otp/verify',
    (req, res, ctx) => {
      if (req.body.otp === '123456') {
        return res(ctx.delay(), ctx.status(200))
      }
      return res(
        ctx.delay(),
        ctx.status(401),
        ctx.json({ message: 'Wrong OTP' }),
      )
    },
  ),
  rest.get('/api/v3/auth/logout', (_req, res, ctx) => {
    return res(
      ctx.delay(),
      ctx.status(200),
      ctx.json({ message: 'Sign out successful' }),
    )
  }),
]
