import { rest } from 'msw'

import { ErrorDto } from '~shared/types/core'
import { UserDto, VerifyUserContactOtpDto } from '~shared/types/user'

import { LOGGED_IN_KEY } from '~constants/localStorage'

import { DefaultRequestReturn, WithDelayProps } from './types'

export const MOCK_USER = {
  _id: 'mock_id',
  email: 'test@example.com',
  agency: {
    emailDomain: ['example.com'],
    _id: '59bb6d4ef06ef18400109733',
    lastModified: '2017-09-15T06:03:58.803Z',
    shortName: 'eg',
    fullName: 'Example Agency Name',
    logo: '/path/to/logo/example.jpg',
    created: '2017-09-15T06:03:58.792Z',
  },
  created: '2020-03-26T09:39:44.613Z',
  contact: '+6598765432',
  lastAccessed: '2021-08-24T09:10:02.661Z',
  updatedAt: '2021-08-24T09:10:03.295Z',
} as UserDto

export const getUser = ({
  delay,
  mockUser = MOCK_USER,
}: { mockUser?: UserDto } & WithDelayProps = {}): DefaultRequestReturn => {
  return rest.get<never, UserDto | ErrorDto>(
    '/api/v3/user',
    (_req, res, ctx) => {
      // Check if the user is authenticated in this session
      const isAuthenticated = localStorage.getItem(LOGGED_IN_KEY)
      if (!isAuthenticated) {
        // If not authenticated, respond with a 403 error
        return res(
          ctx.delay(),
          ctx.status(403),
          ctx.json({
            message: 'Not authorized',
          }),
        )
      }
      // If authenticated, return a mocked user details
      return res(ctx.delay(delay), ctx.status(200), ctx.json(mockUser))
    },
  )
}

export const postGenerateContactOtp = ({
  delay,
}: WithDelayProps = {}): DefaultRequestReturn => {
  return rest.post('/api/v3/user/contact/otp/generate', (_req, res, ctx) => {
    return res(ctx.delay(delay), ctx.status(200))
  })
}

export const postVerifyContactOtp = ({
  delay,
  mockOtp,
}: WithDelayProps & { mockOtp?: string } = {}): DefaultRequestReturn => {
  return rest.post<VerifyUserContactOtpDto, UserDto | ErrorDto>(
    '/api/v3/user/contact/otp/verify',
    (req, res, ctx) => {
      const nextContact = req.body.contact

      if (mockOtp && req.body.otp !== mockOtp) {
        return res(
          ctx.delay(delay),
          ctx.status(422),
          ctx.json({ message: 'OTP is invalid. Please try again.' }),
        )
      }

      return res(
        ctx.delay(delay),
        ctx.status(200),
        ctx.json({ ...MOCK_USER, contact: nextContact }),
      )
    },
  )
}

export const userHandlers = (
  props: WithDelayProps = {},
): DefaultRequestReturn[] => [
  getUser(props),
  postGenerateContactOtp(props),
  postVerifyContactOtp(props),
]
