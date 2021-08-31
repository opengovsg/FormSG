import { rest } from 'msw'

import { ErrorDto } from '~shared/types/core'
import { UserDto } from '~shared/types/user'

const MOCK_USER = {
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
  contact: '+65987654321',
  lastAccessed: '2021-08-24T09:10:02.661Z',
  updatedAt: '2021-08-24T09:10:03.295Z',
} as UserDto

export const authHandlers = [
  rest.post<{ email: string }, string>(
    '/api/v3/auth/otp/generate',
    (req, res, ctx) => {
      return res(
        ctx.delay(),
        ctx.status(200),
        ctx.json(`OTP sent to ${req.body.email}`),
      )
    },
  ),
  rest.post<{ email: string; otp: string }, UserDto | ErrorDto>(
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
  rest.get<never, UserDto | ErrorDto>('/api/v3/user', (req, res, ctx) => {
    // Check if the user is authenticated in this session
    const isAuthenticated = localStorage.getItem('is-logged-in')
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
    return res(ctx.delay(), ctx.status(200), ctx.json(MOCK_USER))
  }),
  rest.get('/api/v3/auth/logout', (req, res, ctx) => {
    return res(
      ctx.delay(),
      ctx.status(200),
      ctx.json({ message: 'Sign out successful' }),
    )
  }),
]
